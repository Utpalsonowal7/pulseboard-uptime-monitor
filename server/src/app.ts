import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import monitorRoutes from "./routes/monitor.routes.js";
import statusRoutes from "./routes/status.routes.js";
import { sameOrigin } from "./middleware/sameOrigin.js";
import { csrfProtection } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/errorHandler.js";

export const app = express();
app.disable("x-powered-by");
if (env.TRUST_PROXY_HOPS > 0) app.set("trust proxy", env.TRUST_PROXY_HOPS);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type", "X-CSRF-Token"] }));
app.use(express.json({ limit: "32kb" }));
app.use(cookieParser());
app.use("/api", sameOrigin);
app.use("/api", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));
app.use("/api", csrfProtection);
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { status: "ok", database: "connected", timestamp: new Date().toISOString() } });
  } catch {
    res.status(503).json({ error: { message: "Database is unavailable" } });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/monitors", monitorRoutes);
app.use("/api/status", statusRoutes);
app.use((_req, res) => res.status(404).json({ error: { message: "Route not found" } }));
app.use(errorHandler);
