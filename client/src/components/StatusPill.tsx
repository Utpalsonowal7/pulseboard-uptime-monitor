import { CircleCheck, CircleDashed, CircleX, PauseCircle } from 'lucide-react';
import type { Monitor } from '../types';

export type ServiceState = 'operational' | 'degraded' | 'down' | 'paused' | 'pending';
export function getState(monitor: Pick<Monitor, 'enabled' | 'stats'>): ServiceState {
  if (!monitor.enabled) return 'paused';
  const latest = monitor.stats.latestCheck;
  if (!latest) return 'pending';
  if (!latest.isOnline) return 'down';
  if ((latest.responseTimeMs ?? 0) > 1800) return 'degraded';
  return 'operational';
}
const config = {
  operational: { label: 'Operational', Icon: CircleCheck },
  degraded: { label: 'Degraded', Icon: CircleDashed },
  down: { label: 'Down', Icon: CircleX },
  paused: { label: 'Paused', Icon: PauseCircle },
  pending: { label: 'Waiting for check', Icon: CircleDashed },
} as const;
export function StatusPill({ state }: { state: ServiceState }) {
  const { label, Icon } = config[state];
  return <span className={`status-pill status-${state}`}><Icon size={14} strokeWidth={2.1} />{label}</span>;
}
