import { api } from '../lib/api';
import type { Incident, Monitor, PublicStatus, Check, Stats } from '../types';
export interface MonitorPayload { name: string; url: string; slug: string; enabled?: boolean }
export const monitorService = {
  async list() { return (await api.get<{ data: Monitor[] }>('/monitors')).data.data; },
  async create(payload: MonitorPayload) { return (await api.post<{ data: Monitor }>('/monitors', payload)).data.data; },
  async update(id: string, payload: Partial<MonitorPayload>) { return (await api.patch<{ data: Monitor }>(`/monitors/${id}`, payload)).data.data; },
  async remove(id: string) { await api.delete(`/monitors/${id}`); },
  async get(id: string) { return (await api.get<{ data: Monitor }>(`/monitors/${id}`)).data.data; },
  async checks(id: string) { return (await api.get<{ data: Check[] }>(`/monitors/${id}/checks`)).data.data; },
  async stats(id: string) { return (await api.get<{ data: Stats }>(`/monitors/${id}/stats`)).data.data; },
  async incidents(id: string) { return (await api.get<{ data: Incident[] }>(`/monitors/${id}/incidents`)).data.data; },
  async status(slug: string) { return (await api.get<{ data: PublicStatus }>(`/status/${slug}`)).data.data; },
};
