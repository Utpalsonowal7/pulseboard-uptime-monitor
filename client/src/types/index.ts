export interface Check {
  id: string; monitorId: string; statusCode: number | null; responseTimeMs: number | null;
  isOnline: boolean; errorMessage: string | null; checkedAt: string;
}
export interface HistoryPoint { responseTimeMs: number | null; isOnline: boolean; checkedAt: string }
export interface Incident {
  id: string; monitorId: string; startedAt: string; resolvedAt: string | null;
  status: 'OPEN' | 'RESOLVED'; initialError: string | null;
}
export interface Stats {
  uptime24h: number | null; uptime7d: number | null; averageResponseTimeMs: number | null;
  latestCheck: Check | null; incidentCount: number; checks24h: number; checks7d: number;
}
export interface Monitor {
  id: string; name: string; url: string; slug: string; enabled: boolean;
  createdAt: string; updatedAt: string; stats: Stats; history?: HistoryPoint[];
}
export interface PublicStatus { monitor: Omit<Monitor, 'stats'>; stats: Stats; incidents: Incident[]; checks: Check[] }
