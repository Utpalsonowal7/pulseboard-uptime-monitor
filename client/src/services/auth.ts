import { api } from '../lib/api';
export interface User { id: string; name: string; email: string; createdAt: string }
interface UserResponse { data: { user: User } }
export const authKeys = { me: ['auth', 'me'] as const };
export const authService = {
  async me() { return (await api.get<UserResponse>('/auth/me')).data.data.user; },
  async login(input: { email: string; password: string }) { return (await api.post<UserResponse>('/auth/login', input)).data.data.user; },
  async register(input: { name: string; email: string; password: string }) { return (await api.post<UserResponse>('/auth/register', input)).data.data.user; },
  async logout() { await api.post('/auth/logout'); },
};
