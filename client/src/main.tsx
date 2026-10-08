import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { MonitorPage } from './pages/MonitorPage';
import { PublicStatusPage } from './pages/PublicStatusPage';
import { AuthLoading, AuthPage } from './pages/AuthPage';
import { authKeys, authService } from './services/auth';
import './styles.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000, refetchOnWindowFocus: true } } });
function Workspace() {
  const auth = useQuery({ queryKey: authKeys.me, queryFn: authService.me, retry: false });
  if (auth.isPending) return <AuthLoading />;
  if (auth.isError || !auth.data) return <Navigate to="/login" replace />;
  return <AppShell user={auth.data} onAdd={() => window.dispatchEvent(new Event('pulseboard:add-monitor'))} />;
}
function GuestPage({ mode }: { mode: 'login' | 'register' }) {
  const auth = useQuery({ queryKey: authKeys.me, queryFn: authService.me, retry: false });
  if (auth.isPending) return <AuthLoading />;
  if (auth.data) return <Navigate to="/" replace />;
  return <AuthPage mode={mode} />;
}
const router = createBrowserRouter([
  { path: '/status/:slug', element: <PublicStatusPage /> },
  { path: '/login', element: <GuestPage mode="login" /> },
  { path: '/register', element: <GuestPage mode="register" /> },
  { path: '/', element: <Workspace />, children: [
    { index: true, element: <DashboardPage /> },
    { path: 'monitors/:id', element: <MonitorPage /> },
    { path: 'incidents', element: <IncidentsPage /> },
  ] },
  { path: '*', element: <Navigate to="/" replace /> },
]);
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider></React.StrictMode>);
