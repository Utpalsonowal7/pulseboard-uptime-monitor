import { app } from "./app.js";
import { prisma } from "./config/database.js";
import { env } from "./config/env.js";
import { startMonitorScheduler, stopMonitorScheduler } from "./jobs/monitorScheduler.js";
import { logger } from "./utils/logger.js";

let server: ReturnType<typeof app.listen> | undefined;
let shuttingDown = false;

async function start(): Promise<void> {
  await prisma.$connect();
  server = app.listen(env.PORT, "0.0.0.0", () => {
    logger.info("PulseBoard API started", { port: env.PORT, environment: env.NODE_ENV });
    startMonitorScheduler();
  });
  server.on("error", (error) => {
    logger.error("API listener failed", { message: error.message });
    stopMonitorScheduler();
    void prisma.$disconnect().catch(() => undefined);
    process.exitCode = 1;
  });
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info("Shutting down", { signal });
  stopMonitorScheduler();
  const forceTimer = setTimeout(() => {
    logger.error("Graceful shutdown timed out");
    server?.closeAllConnections();
  }, 10_000);
  forceTimer.unref();
  try {
    if (server) await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  } catch (error) {
    logger.error("Shutdown failed", { message: error instanceof Error ? error.message : "Unknown error" });
    process.exitCode = 1;
  } finally {
    clearTimeout(forceTimer);
  }
}
void start().catch(async (error: unknown) => {
  logger.error("API startup failed", { message: error instanceof Error ? error.message : "Unknown error" });
  await prisma.$disconnect().catch(() => undefined);
  process.exitCode = 1;
});
process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("SIGINT", () => { void shutdown("SIGINT"); });
