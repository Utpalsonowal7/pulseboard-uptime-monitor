import { useQueries } from '@tanstack/react-query';
import { ArrowUpRight, Check, CircleAlert, Clock3, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMonitors } from '../hooks/useMonitors';
import { monitorService } from '../services/monitors';
import { apiErrorHint, apiErrorTitle } from '../lib/api';
export function IncidentsPage() {
  const monitorsQuery = useMonitors();
  const monitors = monitorsQuery.data ?? [];
  const incidentQueries = useQueries({ queries: monitors.map((monitor) => ({ queryKey: ['monitors', monitor.id, 'incidents'], queryFn: () => monitorService.incidents(monitor.id), enabled: !!monitor.id })) });
  const rows = incidentQueries.flatMap((query, index) => (query.data ?? []).map((incident) => ({ ...incident, monitor: monitors[index] }))).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const active = rows.filter((incident) => incident.status === 'OPEN');
  return <><section className="welcome-row incidents-welcome"><div><p className="eyebrow"><span className="eyebrow-dot" /> SERVICE HEALTH</p><h1>Incident <span>log.</span></h1><p className="welcome-subtitle">A timeline of interruptions and recoveries across your services.</p></div><div className="incident-summary"><span className={active.length ? 'incident-summary-dot active' : 'incident-summary-dot'} /><strong>{active.length ? `${active.length} ongoing` : 'All clear'}</strong><span>right now</span></div></section>
    {monitorsQuery.isError && <div className="api-alert"><CircleAlert size={17} /><div><strong>{apiErrorTitle(monitorsQuery.error)}</strong><span>{apiErrorHint(monitorsQuery.error)}</span></div></div>}
    <section className="incident-overview-cards"><div><span>Ongoing</span><strong>{active.length.toString().padStart(2, '0')}</strong><small>Open right now</small></div><div><span>Last 7 days</span><strong>{rows.filter((i) => Date.now() - new Date(i.startedAt).getTime() < 7 * 86400000).length.toString().padStart(2, '0')}</strong><small>Incidents started</small></div><div><span>Services tracked</span><strong>{monitors.length.toString().padStart(2, '0')}</strong><small>Across your workspace</small></div></section>
    <div className="section-heading incident-heading"><div><h2>All incidents <span className="heading-count">{rows.length}</span></h2><p>Most recent events first.</p></div></div>
    <div className="incident-table">{monitorsQuery.isPending || incidentQueries.some((q) => q.isPending) ? <div className="incidents-empty"><div className="loading-ring" />Loading incident history…</div> : rows.length ? rows.map((incident) => <div className="incident-table-row" key={incident.id}><div className={`incident-event-icon ${incident.status.toLowerCase()}`}>{incident.status === 'OPEN' ? <CircleAlert size={16} /> : <Check size={16} />}</div><div className="incident-event-main"><strong>{incident.status === 'OPEN' ? 'Service interruption' : 'Incident resolved'}</strong><span>{incident.initialError || 'Endpoint did not respond successfully'}</span></div><Link to={`/monitors/${incident.monitor?.id}`} className="incident-service">{incident.monitor?.name ?? 'Monitor'}<ArrowUpRight size={12} /></Link><span className={`incident-state ${incident.status.toLowerCase()}`}>{incident.status === 'OPEN' ? 'Ongoing' : 'Resolved'}</span><span className="incident-event-time"><Clock3 size={13} />{new Date(incident.startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>) : <div className="incidents-empty"><div className="empty-center"><ShieldCheck size={24} /></div><strong>No incidents to report</strong><span>Your services have had a quiet run. When a monitor goes down, you’ll find the full event here.</span></div>}</div>
    </>;
}
