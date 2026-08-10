/**
 * Lightweight stale-while-revalidate data cache.
 *
 * - Returns cached data instantly while revalidating in the background.
 * - Deduplicates concurrent requests to the same key.
 * - TTL-based expiry (stale data is still returned, but triggers a refetch).
 */

type CacheEntry<T = unknown> = {
  data: T;
  timestamp: number;
};

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

const DEFAULT_TTL_MS = 30_000; // 30 seconds

/**
 * Get cached data for a key, or `null` if nothing is cached.
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  return entry ? (entry.data as T) : null;
}

/**
 * Check whether the cached entry for `key` is still fresh (within TTL).
 */
export function isFresh(key: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
  const entry = cache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < ttlMs;
}

/**
 * Fetch data using a stale-while-revalidate strategy.
 *
 * 1. If fresh data exists in the cache, return it immediately (no network call).
 * 2. If stale data exists, return it immediately AND refetch in the background.
 * 3. If no data exists, await the network call and return the result.
 *
 * @param key     Cache key (typically the API path).
 * @param fetcher Async function that performs the actual API call.
 * @param ttlMs   How long data is considered "fresh" (default 30s).
 * @param onUpdate Callback invoked when background revalidation completes with new data.
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
  onUpdate?: (data: T) => void,
): Promise<T> {
  // If fresh, return immediately — no network call
  if (isFresh(key, ttlMs)) {
    return getCached<T>(key)!;
  }

  const staleData = getCached<T>(key);

  // Deduplicate concurrent requests
  if (!inflight.has(key)) {
    const promise = fetcher()
      .then((data) => {
        cache.set(key, { data, timestamp: Date.now() });
        inflight.delete(key);
        return data;
      })
      .catch((err) => {
        inflight.delete(key);
        throw err;
      });
    inflight.set(key, promise);
  }

  // If we have stale data, return it immediately and let the bg fetch update via callback
  if (staleData !== null) {
    inflight.get(key)!.then((freshData) => {
      onUpdate?.(freshData as T);
    }).catch(() => { /* swallow — stale data is already shown */ });
    return staleData;
  }

  // No cached data at all — must wait for the network
  return inflight.get(key) as Promise<T>;
}

/**
 * Invalidate one or more cache keys.
 * Call this after mutations (e.g. completing a quiz, submitting a stage).
 */
export function invalidateCache(...keys: string[]) {
  for (const key of keys) {
    cache.delete(key);
  }
}

/**
 * Invalidate all cache entries whose key starts with the given prefix.
 */
export function invalidateCacheByPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear the entire cache.
 */
export function clearCache() {
  cache.clear();
}
