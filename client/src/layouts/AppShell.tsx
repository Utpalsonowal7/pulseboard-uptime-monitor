import { Activity, Command, Gauge, LogOut, Menu, Plus, RadioTower, X } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authKeys, authService, type User } from '../services/auth';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const nav = [
  { to: '/', label: 'Overview', Icon: Gauge, end: true },
  { to: '/incidents', label: 'Incidents', Icon: Activity },
];
export function AppShell({ onAdd, user }: { onAdd: () => void; user: User }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const logout = useMutation({ mutationFn: authService.logout, onSuccess: () => { client.removeQueries({ queryKey: authKeys.me }); navigate('/login', { replace: true }); } });
  const initials = user.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = location.pathname.startsWith('/incidents') ? 'Incident log' : location.pathname.startsWith('/monitors/') ? 'Monitor details' : 'Overview';
  const sidebar = <>
    <div className="brand"><div className="brand-mark"><RadioTower size={19} strokeWidth={2.25} /></div><span>pulseboard</span><span className="brand-beta">BETA</span></div>
    <div className="workspace-switcher"><div className="workspace-avatar">{initials}</div><div className="workspace-copy"><strong>{user.name}</strong><span>Personal workspace</span></div></div>
    <p className="nav-caption">WORKSPACE</p>
    <nav className="primary-nav">{nav.map(({ to, label, Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={17} /><span>{label}</span>{label === 'Incidents' && <span className="nav-count">•</span>}</NavLink>)}
      <button className="nav-item add-monitor-nav" onClick={onAdd}><Plus size={17} /><span>Add monitor</span></button>
    </nav>
    <div className="sidebar-bottom"><div className="profile-row"><div className="profile-avatar">{initials}</div><div><strong>{user.name}</strong><span>{user.email}</span></div><button className="icon-button" onClick={() => logout.mutate()} disabled={logout.isPending} aria-label="Sign out" title="Sign out"><LogOut size={16} /></button></div></div>
  </>;
  return <div className="app-shell">
    <aside className="sidebar">{sidebar}</aside>
    {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)}><aside className="sidebar mobile-sidebar" onClick={(e) => e.stopPropagation()}>{sidebar}<button className="icon-button mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></aside></div>}
    <main className="main-area"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={19} /></button><div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{title}</strong></div></div><div className="topbar-right"><span className="topbar-account">{user.email}</span><div className="topbar-divider" /><div className="topbar-avatar">{initials}</div></div></header><div className="page-wrap"><Outlet /></div><footer className="page-footer"><span>PulseBoard <span>© 2026</span></span><span>Monitoring, made clear <Command size={12} /></span></footer></main>
  </div>;
}
