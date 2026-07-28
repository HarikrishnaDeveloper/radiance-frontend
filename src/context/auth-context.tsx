import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { api, ApiError } from '@/lib/api-client';
import type { AuthResponse, AuthUser } from '@/types/api';

const ACCESS_TOKEN_KEY = 'radiance_access_token';
const REFRESH_TOKEN_KEY = 'radiance_refresh_token';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<AuthUser>;
  completeProfile: (details: {
    name: string;
    email?: string;
    state?: string;
    dateOfBirth?: string;
    password?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(result: AuthResponse) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, result.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refreshToken);
}

async function clearSession() {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    // Secure storage is unavailable on this platform/build — nothing to clear.
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    (async () => {
      let storedAccessToken: string | null = null;
      let storedRefreshToken: string | null = null;
      try {
        storedAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      } catch {
        // Secure storage is unavailable on this platform/build — treat as no session.
      }
      if (!storedAccessToken || !storedRefreshToken) {
        await clearSession();
        setStatus('signedOut');
        return;
      }

      try {
        const me = await api.me(storedAccessToken);
        setToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        setUser(me);
        setStatus('signedIn');
        return;
      } catch {
        // Access token likely expired (15 min TTL) — fall through to a refresh attempt
        // so a returning user isn't signed out just because the app was closed a while.
      }

      try {
        const rotated = await api.refresh(storedRefreshToken);
        const me = await api.me(rotated.accessToken);
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, rotated.accessToken);
        await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, rotated.refreshToken);
        setToken(rotated.accessToken);
        setRefreshToken(rotated.refreshToken);
        setUser(me);
        setStatus('signedIn');
      } catch {
        await clearSession();
        setStatus('signedOut');
      }
    })();
  }, []);

  const applySession = useCallback(async (result: AuthResponse) => {
    await persistSession(result);
    setToken(result.accessToken);
    setRefreshToken(result.refreshToken);
    setUser(result.user);
    setStatus('signedIn');
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await api.login(username, password);
      await applySession(result);
    },
    [applySession]
  );

  const requestOtp = useCallback(async (phone: string) => {
    await api.requestOtp(phone);
  }, []);

  const verifyOtp = useCallback(
    async (phone: string, code: string) => {
      const result = await api.verifyOtp(phone, code);
      await applySession(result);
      return result.user;
    },
    [applySession]
  );

  const completeProfile = useCallback(
    async (details: { name: string; email?: string; state?: string; dateOfBirth?: string; password?: string }) => {
      if (!token) throw new Error('Not signed in');
      const result = await api.updateProfile(token, details);
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, result.accessToken);
      setToken(result.accessToken);
      setUser(result.user);
    },
    [token]
  );

  const logout = useCallback(async () => {
    if (refreshToken) {
      await api.logout(refreshToken).catch(() => undefined);
    }
    await clearSession();
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setStatus('signedOut');
  }, [refreshToken]);

  const value = useMemo(
    () => ({ status, token, user, login, requestOtp, verifyOtp, completeProfile, logout }),
    [status, token, user, login, requestOtp, verifyOtp, completeProfile, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { ApiError };
