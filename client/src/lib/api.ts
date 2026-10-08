import axios, { type InternalAxiosRequestConfig } from 'axios';

interface RetryConfig extends InternalAxiosRequestConfig { _pulseboardRetried?: boolean }
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 15_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshPromise: Promise<unknown> | null = null;
let csrfToken: string | null = null;
let csrfTokenExpiresAt = 0;
let csrfPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken && Date.now() < csrfTokenExpiresAt - 60_000) return csrfToken;
  csrfPromise ??= api.get<{ data: { csrfToken: string } }>('/auth/csrf')
    .then((response) => {
      csrfToken = response.data.data.csrfToken;
      csrfTokenExpiresAt = Date.now() + 11 * 60 * 60 * 1000;
      return csrfToken;
    })
    .finally(() => { csrfPromise = null; });
  return csrfPromise;
}

api.interceptors.request.use(async (request) => {
  if (['post', 'put', 'patch', 'delete'].includes((request.method ?? 'get').toLowerCase())) {
    request.headers.set('X-CSRF-Token', await getCsrfToken());
  }
  return request;
});

api.interceptors.response.use((response) => response, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) throw error;
  const request = error.config as RetryConfig | undefined;
  const url = request?.url ?? '';
  if (!request || request._pulseboardRetried || ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'].some((path) => url.endsWith(path))) throw error;
  request._pulseboardRetried = true;
  refreshPromise ??= api.post('/auth/refresh').finally(() => { refreshPromise = null; });
  try { await refreshPromise; return await api.request(request); }
  catch { throw error; }
});

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message ?? (error.code === 'ECONNABORTED' ? 'The API took too long to respond.' : 'Could not connect to the PulseBoard API.');
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}
