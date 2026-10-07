import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/database.js";

export async function getMonitorStats(monitorId: string) {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const recentWhere: Prisma.MonitorCheckWhereInput = { monitorId, checkedAt: { gte: weekAgo } };
  const [dayTotal, dayUp, weekTotal, weekUp, average, latestCheck, incidentCount] = await Promise.all([
    prisma.monitorCheck.count({ where: { monitorId, checkedAt: { gte: dayAgo } } }),
    prisma.monitorCheck.count({ where: { monitorId, checkedAt: { gte: dayAgo }, isOnline: true } }),
    prisma.monitorCheck.count({ where: recentWhere }),
    prisma.monitorCheck.count({ where: { ...recentWhere, isOnline: true } }),
    prisma.monitorCheck.aggregate({ where: recentWhere, _avg: { responseTimeMs: true } }),
    prisma.monitorCheck.findFirst({ where: { monitorId }, orderBy: { checkedAt: "desc" } }),
    prisma.incident.count({ where: { monitorId } }),
  ]);
  return {
    uptime24h: dayTotal === 0 ? null : (dayUp / dayTotal) * 100,
    uptime7d: weekTotal === 0 ? null : (weekUp / weekTotal) * 100,
    averageResponseTimeMs: average._avg.responseTimeMs,
    latestCheck,
    incidentCount,
    checks24h: dayTotal,
    checks7d: weekTotal,
  };
}
