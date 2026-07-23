import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';

import { api, ApiError } from '@/lib/api-client';
import type { AuthUser } from '@/types/api';

const TOKEN_KEY = 'radiance_auth_token';

type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    (async () => {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!storedToken) {
        setStatus('signedOut');
        return;
      }
      try {
        const me = await api.me(storedToken);
        setToken(storedToken);
        setUser(me);
        setStatus('signedIn');
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setStatus('signedOut');
      }
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await api.login(username, password);
    await SecureStore.setItemAsync(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
    setStatus('signedIn');
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      await api.logout(token).catch(() => undefined);
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus('signedOut');
  }, [token]);

  const value = useMemo(
    () => ({ status, token, user, login, logout }),
    [status, token, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { ApiError };
