import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { MonitorPage } from './pages/MonitorPage';
import { PublicStatusPage } from './pages/PublicStatusPage';
import './styles.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15_000, refetchOnWindowFocus: true } } });
const router = createBrowserRouter([
  { path: '/status/:slug', element: <PublicStatusPage /> },
  { path: '/', element: <AppShell onAdd={() => window.dispatchEvent(new Event('pulseboard:add-monitor'))} />, children: [
    { index: true, element: <DashboardPage /> },
    { path: 'monitors/:id', element: <MonitorPage /> },
    { path: 'incidents', element: <IncidentsPage /> },
  ] },
  { path: '*', element: <DashboardPage /> },
]);
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><QueryClientProvider client={queryClient}><RouterProvider router={router} /></QueryClientProvider></React.StrictMode>);
