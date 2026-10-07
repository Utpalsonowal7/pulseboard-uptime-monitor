import axios from "axios";
import { prisma } from "../config/database.js";
import { logger } from "../utils/logger.js";
import { assertPublicHttpUrl } from "./ssrfProtection.service.js";

const CHECK_TIMEOUT_MS = 10_000;

export async function checkMonitor(monitor: { id: string; name: string; url: string }): Promise<void> {
  const checkedAt = new Date();
  const started = performance.now();
  let statusCode: number | null = null;
  let errorMessage: string | null = null;
  let isOnline = false;
  try {
    const url = await assertPublicHttpUrl(monitor.url);
    const response = await axios.get(url.toString(), {
      timeout: CHECK_TIMEOUT_MS,
      maxRedirects: 0,
      validateStatus: () => true,
      headers: { "User-Agent": "PulseBoard-Monitor/1.0" },
      responseType: "stream",
    });
    statusCode = response.status;
    isOnline = statusCode >= 200 && statusCode < 400;
    response.data.destroy();
    if (!isOnline) errorMessage = `HTTP ${statusCode}`;
  } catch (error) {
    errorMessage = error instanceof Error ? error.message.slice(0, 500) : "Request failed";
  }
  const responseTimeMs = Math.max(0, Math.round(performance.now() - started));

  await prisma.$transaction(async (tx) => {
    await tx.monitorCheck.create({ data: { monitorId: monitor.id, statusCode, responseTimeMs, isOnline, errorMessage, checkedAt } });
    const openIncident = await tx.incident.findFirst({ where: { monitorId: monitor.id, status: "OPEN" }, orderBy: { startedAt: "desc" } });
    if (!isOnline && !openIncident) {
      await tx.incident.create({ data: { monitorId: monitor.id, initialError: errorMessage, startedAt: checkedAt } });
      logger.warn("Incident opened", { monitorId: monitor.id, statusCode, error: errorMessage });
    } else if (isOnline && openIncident) {
      await tx.incident.update({ where: { id: openIncident.id }, data: { status: "RESOLVED", resolvedAt: checkedAt } });
      logger.info("Incident resolved", { monitorId: monitor.id, incidentId: openIncident.id });
    }
  });
  if (!isOnline) logger.warn("Monitor check failed", { monitorId: monitor.id, statusCode, responseTimeMs, error: errorMessage });
}

export async function checkEnabledMonitors(): Promise<void> {
  const monitors = await prisma.monitor.findMany({ where: { enabled: true }, select: { id: true, name: true, url: true } });
  for (const monitor of monitors) {
    try { await checkMonitor(monitor); }
    catch (error) {
      logger.error("Could not save monitor check", { monitorId: monitor.id, message: error instanceof Error ? error.message : "Unknown error" });
    }
  }
}
