import { app } from "./app.js";
import { prisma } from "./config/database.js";
import { env } from "./config/env.js";
import { startMonitorScheduler, stopMonitorScheduler } from "./jobs/monitorScheduler.js";
import { logger } from "./utils/logger.js";

const server = app.listen(env.PORT, "0.0.0.0", () => {
  logger.info("PulseBoard API started", { port: env.PORT, environment: env.NODE_ENV });
  startMonitorScheduler();
});

async function shutdown(signal: string): Promise<void> {
  logger.info("Shutting down", { signal });
  stopMonitorScheduler();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("SIGINT", () => { void shutdown("SIGINT"); });
