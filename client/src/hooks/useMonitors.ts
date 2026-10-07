import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { monitorService } from '../services/monitors';
import type { MonitorPayload } from '../services/monitors';

export const monitorKeys = { all: ['monitors'] as const, detail: (id: string) => ['monitors', id] as const };
export function useMonitors() { return useQuery({ queryKey: monitorKeys.all, queryFn: monitorService.list, refetchInterval: 30_000 }); }
export function useCreateMonitor() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (payload: MonitorPayload) => monitorService.create(payload), onSuccess: () => client.invalidateQueries({ queryKey: monitorKeys.all }) });
}
export function useUpdateMonitor() {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, ...payload }: { id: string } & Partial<MonitorPayload>) => monitorService.update(id, payload), onSuccess: () => client.invalidateQueries({ queryKey: monitorKeys.all }) });
}
export function useDeleteMonitor() {
  const client = useQueryClient();
  return useMutation({ mutationFn: monitorService.remove, onSuccess: () => client.invalidateQueries({ queryKey: monitorKeys.all }) });
}
