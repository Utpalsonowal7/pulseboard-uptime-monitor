import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import monitorRoutes from "./routes/monitor.routes.js";
import statusRoutes from "./routes/status.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json({ limit: "32kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { status: "ok", database: "connected", timestamp: new Date().toISOString() } });
  } catch {
    res.status(503).json({ error: { message: "Database is unavailable" } });
  }
});
app.use("/api/monitors", monitorRoutes);
app.use("/api/status", statusRoutes);
app.use((_req, res) => res.status(404).json({ error: { message: "Route not found" } }));
app.use(errorHandler);
