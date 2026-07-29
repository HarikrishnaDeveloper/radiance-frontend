import type {
  AttemptDetailResponse,
  AttemptHistoryItem,
  AttemptMode,
  AttemptResultsResponse,
  AuthResponse,
  AuthUser,
  CategorySummary,
  CompleteAttemptResponse,
  DashboardResponse,
  PaperSummary,
  SubmitAnswerResponse,
} from '@/types/api';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; token?: string | null; body?: unknown } = {}
): Promise<T> {
  const { method = 'GET', token, body } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, data?.error ?? 'Request failed');
  }

  return data as T;
}

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

  dashboard: (token: string) => request<DashboardResponse>('/api/dashboard', { token }),

  categories: (token: string) => request<CategorySummary[]>('/api/categories', { token }),

  papers: (token: string) => request<PaperSummary[]>('/api/papers', { token }),

  attemptHistory: (token: string, completed?: boolean) =>
    request<AttemptHistoryItem[]>(
      `/api/attempts${completed === undefined ? '' : `?completed=${completed}`}`,
      { token }
    ),

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

  completeAttempt: (token: string, attemptId: number) =>
    request<CompleteAttemptResponse>(`/api/attempts/${attemptId}/complete`, { method: 'POST', token }),

  getResults: (token: string, attemptId: number) =>
    request<AttemptResultsResponse>(`/api/attempts/${attemptId}/results`, { token }),
};

export type { AttemptMode };
