import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, CircleAlert, Clock3, Plus, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCreateMonitor, useDeleteMonitor, useMonitors, useUpdateMonitor } from '../hooks/useMonitors';
import { errorMessage } from '../lib/api';
import type { Monitor } from '../types';
import { MonitorCard } from '../components/MonitorCard';
import { MonitorForm } from '../components/MonitorForm';
import { getState } from '../components/StatusPill';

function statUptime(monitors: Monitor[]) {
  const checked = monitors.filter((m) => m.stats.checks24h > 0);
  if (!checked.length) return '—';
  const total = checked.reduce((sum, m) => sum + m.stats.checks24h, 0);
  const up = checked.reduce((sum, m) => sum + Math.round((m.stats.uptime24h ?? 0) * m.stats.checks24h / 100), 0);
  return `${(up / total * 100).toFixed(2)}%`;
}
function timeAgo(value?: string | null) {
  if (!value) return 'Never';
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60_000);
  return minutes <= 0 ? 'Just now' : minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`;
}
export function DashboardPage() {
  const query = useMonitors();
  const monitors = query.data ?? [];
  const create = useCreateMonitor();
  const update = useUpdateMonitor();
  const remove = useDeleteMonitor();
  const [editing, setEditing] = useState<Monitor | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toast, setToast] = useState('');
  useEffect(() => {
    const open = () => { setEditing(null); setFormOpen(true); };
    window.addEventListener('pulseboard:add-monitor', open);
    return () => window.removeEventListener('pulseboard:add-monitor', open);
  }, []);
  const counts = useMemo(() => monitors.reduce((acc, monitor) => { acc[getState(monitor)]++; return acc; }, { operational: 0, degraded: 0, down: 0, paused: 0, pending: 0 }), [monitors]);
  const lastUpdated = monitors.reduce<string | null>((latest, m) => {
    const current = m.stats.latestCheck?.checkedAt;
    return current && (!latest || current > latest) ? current : latest;
  }, null);
  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 3500); }
  function openEdit(monitor: Monitor) { setEditing(monitor); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditing(null); create.reset(); update.reset(); }
  const error = create.isError ? errorMessage(create.error) : update.isError ? errorMessage(update.error) : undefined;
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date()).toUpperCase();
  return <>
    <section className="welcome-row"><div><p className="eyebrow"><span className="eyebrow-dot" /> {today}</p><h1>Your services, <span>at a glance.</span></h1><p className="welcome-subtitle">A clear view of what’s up, what’s slow, and what needs attention.</p></div><div className="welcome-actions"><button className="button button-secondary refresh-button" onClick={() => void query.refetch()}><RefreshCw size={15} className={query.isFetching ? 'spin' : ''} />Refresh</button><button className="button button-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={17} />Add monitor</button></div></section>
    {query.isError && <div className="api-alert"><CircleAlert size={17} /><div><strong>Can’t reach the PulseBoard API</strong><span>{errorMessage(query.error)} Start the backend and check `VITE_API_URL`.</span></div><button className="icon-button" onClick={() => void query.refetch()}><RefreshCw size={15} /></button></div>}
    <section className="overview-stats">
      <div className="overview-stat"><div className="stat-label-row"><span>Monitors</span><span className="stat-symbol symbol-indigo"><ShieldCheck size={15} /></span></div><div className="stat-number">{query.isPending ? '—' : monitors.length.toString().padStart(2, '0')}<span className="stat-caption">services tracked</span></div><div className="stat-foot">Across your workspace</div></div>
      <div className="overview-stat"><div className="stat-label-row"><span>Overall uptime <small>· 24h</small></span><span className="stat-symbol symbol-green"><Check size={15} /></span></div><div className="stat-number">{query.isPending ? '—' : statUptime(monitors)}<span className="stat-trend"><ArrowUpRight size={13} /> healthy</span></div><div className="stat-foot">Weighted across all checked services</div></div>
      <div className="overview-stat"><div className="stat-label-row"><span>Active incidents</span><span className="stat-symbol symbol-amber"><CircleAlert size={15} /></span></div><div className="stat-number">{query.isPending ? '—' : monitors.filter((m) => m.stats.latestCheck && !m.stats.latestCheck.isOnline).length.toString().padStart(2, '0')}<span className="stat-caption">need attention</span></div><div className="stat-foot">Open incidents across monitors</div></div>
      <div className="overview-stat"><div className="stat-label-row"><span>Last checked</span><span className="stat-symbol symbol-blue"><Clock3 size={15} /></span></div><div className="stat-number stat-time">{timeAgo(lastUpdated)}<span className="stat-caption">automatic checks</span></div><div className="stat-foot">Checks run every 60 seconds</div></div>
    </section>
    <div className="section-heading"><div><h2>Your monitors <span className="heading-count">{monitors.length}</span></h2><p>Keep an eye on every endpoint that matters.</p></div><button className="text-button" onClick={() => { setEditing(null); setFormOpen(true); }}>Add a service <ArrowRight size={14} /></button></div>
    {query.isPending ? <div className="monitor-grid">{[0, 1, 2].map((i) => <div className="monitor-skeleton" key={i}><div /><div /><div /><div /></div>)}</div> : monitors.length ? <div className="monitor-grid">{monitors.map((monitor) => <MonitorCard key={monitor.id} monitor={monitor} onEdit={openEdit} onDelete={(item) => { if (window.confirm(`Delete “${item.name}” and all its check history?`)) remove.mutate(item.id, { onSuccess: () => notify(`${item.name} was deleted.`), onError: (e) => notify(errorMessage(e)) }); }} onToggle={(item) => update.mutate({ id: item.id, enabled: !item.enabled }, { onSuccess: () => notify(`${item.name} checks ${item.enabled ? 'paused' : 'resumed'}.`) })} />)}</div> : !query.isError && <div className="empty-state"><div className="empty-art"><div className="empty-orbit orbit-one" /><div className="empty-orbit orbit-two" /><div className="empty-center"><ShieldCheck size={25} /></div><div className="empty-star star-one"><Sparkles size={14} /></div><div className="empty-star star-two"><Check size={13} /></div></div><p className="eyebrow">A FRESH START</p><h2>Nothing to monitor. Yet.</h2><p>Add your website or API and PulseBoard will begin checking it every minute. Your history builds from the first check.</p><button className="button button-primary" onClick={() => setFormOpen(true)}><Plus size={16} />Add your first monitor</button><div className="empty-note"><span><Check size={13} /> 60-second checks</span><span><Check size={13} /> Incident history</span><span><Check size={13} /> Shareable status pages</span></div></div>}
    {!!monitors.length && <div className="notice-strip"><div className="notice-icon"><Sparkles size={15} /></div><p><strong>Looking good.</strong> {counts.down ? `${counts.down} service${counts.down > 1 ? 's are' : ' is'} down and may need a closer look.` : counts.pending ? 'New services will show their health after the first check.' : 'Every enabled monitor is responding.'}</p><Link to="/incidents">View incident log <ArrowUpRight size={12} /></Link></div>}
    {formOpen && <MonitorForm monitor={editing} onClose={closeForm} busy={create.isPending || update.isPending} apiError={error} onSubmit={(payload) => {
      if (editing) update.mutate({ id: editing.id, ...payload }, { onSuccess: () => { closeForm(); notify('Monitor updated successfully.'); } });
      else create.mutate(payload, { onSuccess: () => { closeForm(); notify('Monitor added. Its first check will begin shortly.'); } });
    }} />}
    {toast && <div className="toast"><Check size={16} />{toast}<button onClick={() => setToast('')}><X size={14} /></button></div>}
  </>;
}
