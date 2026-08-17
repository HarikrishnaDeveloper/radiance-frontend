import type {
  AttemptDetailResponse,
  AttemptHistoryItem,
  AttemptMode,
  AuthResponse,
  AuthUser,
  CategoryDetailResponse,
  CategorySummary,
  CompleteAttemptResponse,
  ContinueLearning,
  CreateSubscriptionResponse,
  DailyChallengeResponse,
  DailyChallengeSubmitResponse,
  DashboardResponse,
  PaperSummary,
  StageDetailResponse,
  StageResultsResponse,
  StageSubmitResponse,
  StreakResponse,
  SubmitAnswerResponse,
  AttemptResultsResponse,
  SubscriptionStatusResponse,
} from '@/types/api';

import { fetchWithCache, invalidateCache, invalidateCacheByPrefix, clearCache } from './data-cache';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown> | null;

  constructor(status: number, message: string, body: Record<string, unknown> | null = null) {
    super(message);
    this.status = status;
    this.body = body;
  }

  /** True when this request was rejected because the free-stage budget is used up. */
  get isSubscriptionRequired() {
    return this.status === 402 && this.body?.error === 'SUBSCRIPTION_REQUIRED';
  }
}

async function request<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<T> {
  const { method = 'GET', token, body } = options;
  const url = `${BASE_URL}${path}`;

  if (__DEV__) {
    console.log(`[API] → ${method} ${url}`, body !== undefined ? { body } : '');
  }
  const start = Date.now();

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (__DEV__) {
    const elapsedMs = Date.now() - start;
    console.log(`[API] ← ${response.status} ${method} ${url} (${elapsedMs}ms)`, data);
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Request failed', data);
  }

  return data as T;
}

// ─── Cache TTLs ─────────────────────────────────────────────────────────
const CACHE_TTL = {
  dashboard: 30_000,   // 30s — changes often (streak, today's focus)
  categories: 60_000,  // 60s — rarely changes
  papers: 120_000,     // 2min — almost never changes
  categoryDetail: 60_000,
  streak: 30_000,
  dailyChallenge: 60_000,
  attempts: 30_000,
} as const;

// ─── Cache keys ─────────────────────────────────────────────────────────
const cacheKey = {
  dashboard: 'dashboard',
  categories: 'categories',
  papers: 'papers',
  categoryDetail: (id: number) => `categoryDetail:${id}`,
  streak: 'streak',
  dailyChallenge: 'dailyChallenge',
  attempts: (completed?: boolean) => `attempts:${completed}`,
  attempt: (id: number) => `attempt:${id}`,
  stageDetail: (id: number) => `stageDetail:${id}`,
} as const;

export const api = {
  login: (username: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: { username, password } }),

  requestOtp: (phone: string) => request<{ ok: true }>('/api/auth/otp/send', { method: 'POST', body: { phone } }),

  verifyOtp: (phone: string, code: string) =>
    request<AuthResponse>('/api/auth/otp/verify', { method: 'POST', body: { phone, code } }),

  refresh: (refreshToken: string) =>
    request<{ accessToken: string; refreshToken: string }>('/api/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),

  logout: (refreshToken: string) =>
    request<{ ok: true }>('/api/auth/logout', { method: 'POST', body: { refreshToken } }),

  me: (token: string) => request<AuthUser>('/api/auth/me', { token }),

  updateProfile: (
    token: string,
    details: { name?: string; email?: string; state?: string; dateOfBirth?: string; password?: string }
  ) =>
    request<{ accessToken: string; user: AuthUser }>('/api/auth/profile', {
      method: 'PATCH',
      token,
      body: details,
    }),

  // ─── Cached endpoints ───────────────────────────────────────────────

  dashboard: (token: string, onUpdate?: (data: DashboardResponse) => void) =>
    fetchWithCache<DashboardResponse>(
      cacheKey.dashboard,
      () => request<DashboardResponse>('/api/dashboard', { token }),
      CACHE_TTL.dashboard,
      onUpdate,
    ),

  streak: (token: string, onUpdate?: (data: StreakResponse) => void) =>
    fetchWithCache<StreakResponse>(
      cacheKey.streak,
      () => request<StreakResponse>('/api/streak', { token }),
      CACHE_TTL.streak,
      onUpdate,
    ),

  categories: (token: string, onUpdate?: (data: CategorySummary[]) => void) =>
    fetchWithCache<CategorySummary[]>(
      cacheKey.categories,
      () => request<CategorySummary[]>('/api/categories', { token }),
      CACHE_TTL.categories,
      onUpdate,
    ),

  papers: (token: string, onUpdate?: (data: PaperSummary[]) => void) =>
    fetchWithCache<PaperSummary[]>(
      cacheKey.papers,
      () => request<PaperSummary[]>('/api/papers', { token }),
      CACHE_TTL.papers,
      onUpdate,
    ),

  attemptHistory: (token: string, completed?: boolean) =>
    fetchWithCache<AttemptHistoryItem[]>(
      cacheKey.attempts(completed),
      () => request<AttemptHistoryItem[]>(
        `/api/attempts${completed === undefined ? '' : `?completed=${completed}`}`,
        { token }
      ),
      CACHE_TTL.attempts,
    ),

  categoryDetail: (token: string, categoryId: number, onUpdate?: (data: CategoryDetailResponse) => void) =>
    fetchWithCache<CategoryDetailResponse>(
      cacheKey.categoryDetail(categoryId),
      () => request<CategoryDetailResponse>(`/api/categories/${categoryId}`, { token }),
      CACHE_TTL.categoryDetail,
      onUpdate,
    ),

  dailyChallenge: (token: string, onUpdate?: (data: DailyChallengeResponse) => void) =>
    fetchWithCache<DailyChallengeResponse>(
      cacheKey.dailyChallenge,
      () => request<DailyChallengeResponse>('/api/daily-challenge', { token }),
      CACHE_TTL.dailyChallenge,
      onUpdate,
    ),

  // ─── Non-cached (mutations & one-off reads) ─────────────────────────

  createAttempt: (
    token: string,
    body: { mode: 'FULL_PAPER'; questionPaperId: number } | { mode: 'CATEGORY_PRACTICE'; categoryIds: number[] }
  ) => request<{ id: number }>('/api/attempts', { method: 'POST', token, body }),

  getAttempt: (token: string, attemptId: number) =>
    request<AttemptDetailResponse>(`/api/attempts/${attemptId}`, { token }),

  submitAnswer: (token: string, attemptId: number, questionId: number, selectedOptionId: number | null) =>
    request<SubmitAnswerResponse>(`/api/attempts/${attemptId}/answers`, {
      method: 'POST',
      token,
      body: { questionId, selectedOptionId },
    }),

  completeAttempt: (token: string, attemptId: number) => {
    // Invalidate caches that change after completing an attempt
    invalidateCache(cacheKey.dashboard, cacheKey.streak);
    invalidateCacheByPrefix('attempts');
    return request<CompleteAttemptResponse>(`/api/attempts/${attemptId}/complete`, { method: 'POST', token });
  },

  getResults: (token: string, attemptId: number) =>
    request<AttemptResultsResponse>(`/api/attempts/${attemptId}/results`, { token }),

  stageDetail: (token: string, stageId: number) =>
    request<StageDetailResponse>(`/api/stages/${stageId}`, { token }),

  checkStageAnswer: (token: string, stageId: number, questionId: number, selectedOptionId: number | null) =>
    request<SubmitAnswerResponse>(`/api/stages/${stageId}/answers`, {
      method: 'POST',
      token,
      body: { questionId, selectedOptionId },
    }),

  submitStage: (
    token: string,
    stageId: number,
    answers: { questionId: number; selectedOptionId: number | null }[]
  ) => {
    // Invalidate caches that change after submitting a stage
    invalidateCache(cacheKey.dashboard, cacheKey.streak, cacheKey.categories);
    invalidateCacheByPrefix('categoryDetail');
    return request<StageSubmitResponse>(`/api/stages/${stageId}/submit`, {
      method: 'POST',
      token,
      body: { answers },
    });
  },

  stageResults: (token: string, stageId: number) =>
    request<StageResultsResponse>(`/api/stages/${stageId}/results`, { token }),

  continueLearning: (token: string) => request<ContinueLearning>('/api/users/me/continue', { token }),

  submitDailyChallenge: (token: string, answers: { questionId: number; selectedOptionId: number | null }[]) => {
    invalidateCache(cacheKey.dashboard, cacheKey.dailyChallenge, cacheKey.streak);
    return request<DailyChallengeSubmitResponse>('/api/daily-challenge/submit', {
      method: 'POST',
      token,
      body: { answers },
    });
  },

  // ─── Payments / subscription ─────────────────────────────────────────

  subscriptionStatus: (token: string) => request<SubscriptionStatusResponse>('/api/payments/status', { token }),

  createSubscription: (token: string) =>
    request<CreateSubscriptionResponse>('/api/payments/create-subscription', { method: 'POST', token }),

  verifySubscription: (
    token: string,
    payload: { razorpay_payment_id: string; razorpay_subscription_id: string; razorpay_signature: string }
  ) => request<{ ok: true; isPremium: true }>('/api/payments/verify-subscription', { method: 'POST', token, body: payload }),

  cancelSubscription: (token: string) => request<{ ok: true }>('/api/payments/cancel', { method: 'POST', token }),

  // ─── Cache management ───────────────────────────────────────────────

  /** Clear all cached data (call on logout) */
  clearAllCache: clearCache,
};

export type { AttemptMode };
