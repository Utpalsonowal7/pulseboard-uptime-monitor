import { ArrowUpRight, Clock3, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Monitor } from '../types';
import { getState, StatusPill } from './StatusPill';
import { LatencyChart } from './LatencyChart';

function formatTime(value: string | null | undefined) {
  if (!value) return 'Waiting for first check';
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  if (diff < 60_000) return 'Checked just now';
  if (diff < 3_600_000) return `Checked ${Math.floor(diff / 60_000)}m ago`;
  return `Checked ${Math.floor(diff / 3_600_000)}h ago`;
}
function percentage(value: number | null) { return value === null ? '—' : `${value.toFixed(value > 99.9 ? 2 : 1)}%`; }
export function MonitorCard({ monitor, onEdit, onDelete, onToggle }: {
  monitor: Monitor; onEdit: (monitor: Monitor) => void; onDelete: (monitor: Monitor) => void; onToggle: (monitor: Monitor) => void;
}) {
  const state = getState(monitor);
  return <article className="monitor-card">
    <div className="monitor-card-top">
      <div className="monitor-identity"><div className={`service-avatar avatar-${state}`}><span>{monitor.name.slice(0, 1).toUpperCase()}</span></div><div><Link to={`/monitors/${monitor.id}`} className="monitor-name">{monitor.name}<ArrowUpRight size={14} /></Link><a className="monitor-url" href={monitor.url} target="_blank" rel="noreferrer">{monitor.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a></div></div>
      <div className="card-menu-wrap"><details className="card-menu"><summary className="icon-button" aria-label="Monitor actions"><MoreHorizontal size={19} /></summary><div className="menu-popover"><button onClick={() => onEdit(monitor)}><Pencil size={14} />Edit monitor</button><button onClick={() => onToggle(monitor)}>{monitor.enabled ? 'Pause checks' : 'Resume checks'}</button><button className="danger-action" onClick={() => onDelete(monitor)}><Trash2 size={14} />Delete monitor</button></div></details></div>
    </div>
    <div className="card-status-row"><StatusPill state={state} /><span className="last-checked"><Clock3 size={13} />{formatTime(monitor.stats.latestCheck?.checkedAt)}</span></div>
    <div className="monitor-metrics">
      <div><span className="metric-label">Uptime · 24h</span><strong>{percentage(monitor.stats.uptime24h)}</strong></div>
      <div><span className="metric-label">Uptime · 7d</span><strong>{percentage(monitor.stats.uptime7d)}</strong></div>
      <div><span className="metric-label">Avg. latency</span><strong>{monitor.stats.averageResponseTimeMs == null ? '—' : <>{Math.round(monitor.stats.averageResponseTimeMs)}<small>ms</small></>}</strong></div>
    </div>
    <div className="monitor-chart-head"><span>Response time</span><span>Recent checks</span></div>
    <LatencyChart data={monitor.history} id={monitor.id} />
    <div className="monitor-card-foot"><span>{monitor.stats.latestCheck?.statusCode ? `HTTP ${monitor.stats.latestCheck.statusCode}` : 'No response recorded'}</span><Link to={`/status/${monitor.slug}`}>Public status page <ArrowUpRight size={12} /></Link></div>
  </article>;
}
