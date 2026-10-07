import { Activity, ArrowUpRight, Bell, ChevronDown, CircleHelp, Command, Gauge, Globe2, Menu, RadioTower, Settings2, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const nav = [
  { to: '/', label: 'Overview', Icon: Gauge, end: true },
  { to: '/incidents', label: 'Incidents', Icon: Activity },
];
export function AppShell({ onAdd }: { onAdd: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = location.pathname.startsWith('/incidents') ? 'Incident log' : location.pathname.startsWith('/monitors/') ? 'Monitor details' : 'Overview';
  const sidebar = <>
    <div className="brand"><div className="brand-mark"><RadioTower size={19} strokeWidth={2.25} /></div><span>pulseboard</span><span className="brand-beta">BETA</span></div>
    <div className="workspace-switcher"><div className="workspace-avatar">U</div><div className="workspace-copy"><strong>Utpal’s workspace</strong><span>Free plan</span></div><ChevronDown size={15} /></div>
    <p className="nav-caption">WORKSPACE</p>
    <nav className="primary-nav">{nav.map(({ to, label, Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={17} /><span>{label}</span>{label === 'Incidents' && <span className="nav-count">•</span>}</NavLink>)}
      <button className="nav-item" onClick={onAdd}><Globe2 size={17} /><span>Monitors</span><span className="nav-shortcut">+</span></button>
    </nav>
    <div className="sidebar-bottom"><div className="sidebar-promo"><div className="promo-icon"><ShieldCheck size={16} /></div><strong>Made for peace of mind</strong><p>Catch downtime before your customers do.</p><a href="https://aws.amazon.com/app-runner/" target="_blank" rel="noreferrer">Deployment guide <ArrowUpRight size={12} /></a></div><button className="nav-item"><Settings2 size={17} /><span>Settings</span></button><button className="nav-item"><CircleHelp size={17} /><span>Help center</span><ArrowUpRight size={13} className="nav-external" /></button><div className="profile-row"><div className="profile-avatar">US</div><div><strong>Utpal Sonowal</strong><span>Personal workspace</span></div><button className="icon-button"><Menu size={16} /></button></div></div>
  </>;
  return <div className="app-shell">
    <aside className="sidebar">{sidebar}</aside>
    {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)}><aside className="sidebar mobile-sidebar" onClick={(e) => e.stopPropagation()}>{sidebar}<button className="icon-button mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></aside></div>}
    <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={19} /></button><div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div></div><div className="topbar-right"><div className="system-status"><span /> All systems normal</div><button className="icon-button notification-button" aria-label="Notifications"><Bell size={17} /><i /></button><div className="topbar-divider" /><div className="topbar-avatar">US</div></div></header><div className="page-wrap"><Outlet /></div><footer className="page-footer"><span>PulseBoard <span>© 2026</span></span><span>Monitoring, made clear <Command size={12} /></span></footer></main>
  </div>;
}
