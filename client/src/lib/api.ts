import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return error.response?.data?.error?.message ?? (error.code === 'ECONNABORTED' ? 'The API took too long to respond.' : 'Could not connect to the PulseBoard API.');
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}
