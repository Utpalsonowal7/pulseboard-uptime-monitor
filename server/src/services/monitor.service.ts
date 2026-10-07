import { prisma } from "../config/database.js";
import { httpError } from "../utils/errors.js";
import { getMonitorStats } from "./monitorStats.service.js";
import { assertPublicHttpUrl } from "./ssrfProtection.service.js";

export interface MonitorInput {
     name: string;
     url: string;
     slug: string;
     enabled?: boolean;
}
const monitorSelect = {
     id: true,
     name: true,
     url: true,
     slug: true,
     enabled: true,
     createdAt: true,
     updatedAt: true,
} as const;

export async function listMonitors() {
     const monitors = await prisma.monitor.findMany({
          orderBy: { createdAt: "desc" },
          select: monitorSelect,
     });
     return Promise.all(
          monitors.map(async (monitor) => {
               const [stats, history] = await Promise.all([
                    getMonitorStats(monitor.id),
                    prisma.monitorCheck.findMany({
                         where: {
                              monitorId: monitor.id,
                              checkedAt: {
                                   gte: new Date(
                                        Date.now() - 24 * 60 * 60 * 1000,
                                   ),
                              },
                         },
                         orderBy: { checkedAt: "desc" },
                         take: 48,
                         select: {
                              responseTimeMs: true,
                              isOnline: true,
                              checkedAt: true,
                         },
                    }),
               ]);
               return { ...monitor, stats, history: history.reverse() };
          }),
     );
}
export async function createMonitor(input: MonitorInput) {
     await assertPublicHttpUrl(input.url);
     try {
          return await prisma.monitor.create({
               data: { ...input, enabled: input.enabled ?? true },
               select: monitorSelect,
          });
     } catch (error) {
          if (isUniqueError(error))
               throw httpError(409, "That status page slug is already in use");
          throw error;
     }
}
export async function getMonitor(id: string) {
     const monitor = await prisma.monitor.findUnique({
          where: { id },
          select: monitorSelect,
     });
     if (!monitor) throw httpError(404, "Monitor not found");
     return { ...monitor, stats: await getMonitorStats(id) };
}
export async function updateMonitor(id: string, input: Partial<MonitorInput>) {
     const existing = await prisma.monitor.findUnique({
          where: { id },
          select: { id: true },
     });
     if (!existing) throw httpError(404, "Monitor not found");
     if (input.url) await assertPublicHttpUrl(input.url);
     try {
          return await prisma.monitor.update({
               where: { id },
               data: input,
               select: monitorSelect,
          });
     } catch (error) {
          if (isUniqueError(error))
               throw httpError(409, "That status page slug is already in use");
          throw error;
     }
}
export async function deleteMonitor(id: string) {
     const existing = await prisma.monitor.findUnique({
          where: { id },
          select: { id: true },
     });
     if (!existing) throw httpError(404, "Monitor not found");
     await prisma.monitor.delete({ where: { id } });
}
export async function getMonitorChecks(id: string) {
     await ensureMonitor(id);
     return prisma.monitorCheck.findMany({
          where: { monitorId: id },
          orderBy: { checkedAt: "desc" },
          take: 100,
     });
}
export async function getMonitorIncidents(id: string) {
     await ensureMonitor(id);
     return prisma.incident.findMany({
          where: { monitorId: id },
          orderBy: { startedAt: "desc" },
          take: 100,
     });
}
export async function getPublicStatus(slug: string) {
     const monitor = await prisma.monitor.findUnique({
          where: { slug },
          select: monitorSelect,
     });
     if (!monitor) throw httpError(404, "Status page not found");
     const [stats, incidents, checks] = await Promise.all([
          getMonitorStats(monitor.id),
          prisma.incident.findMany({
               where: { monitorId: monitor.id },
               orderBy: { startedAt: "desc" },
               take: 10,
          }),
          prisma.monitorCheck.findMany({
               where: {
                    monitorId: monitor.id,
                    checkedAt: {
                         gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    },
               },
               orderBy: { checkedAt: "asc" },
               take: 200,
          }),
     ]);
     return { monitor, stats, incidents, checks };
}
async function ensureMonitor(id: string): Promise<void> {
     if (
          !(await prisma.monitor.findUnique({
               where: { id },
               select: { id: true },
          }))
     )
          throw httpError(404, "Monitor not found");
}
function isUniqueError(error: unknown): boolean {
     return (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "P2002"
     );
}
