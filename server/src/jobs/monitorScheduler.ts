import { checkEnabledMonitors } from "../services/monitorChecker.service.js";
import { logger } from "../utils/logger.js";

const INTERVAL_MS = 60_000;
let running = false;
let timer: NodeJS.Timeout | undefined;

async function run(): Promise<void> {
  if (running) {
    logger.warn("Monitor run skipped because previous run is still active");
    return;
  }
  running = true;
  try { await checkEnabledMonitors(); }
  catch (error) { logger.error("Monitor scheduler run failed", { message: error instanceof Error ? error.message : "Unknown error" }); }
  finally { running = false; }
}

export function startMonitorScheduler(): void {
  if (timer) return;
  void run();
  timer = setInterval(() => { void run(); }, INTERVAL_MS);
  logger.info("Monitor scheduler started", { intervalMs: INTERVAL_MS });
}

export function stopMonitorScheduler(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
}
