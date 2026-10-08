import type { ErrorRequestHandler } from "express";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  const err = error instanceof Error ? error : new Error("Unknown error");
  const candidate = err as unknown as { statusCode?: unknown; details?: unknown };
  const statusCode = err instanceof ZodError ? 400 : typeof candidate.statusCode === "number" ? candidate.statusCode : 500;
  logger.error("Request failed", { statusCode, message: err.message });
  const details = err instanceof ZodError ? err.flatten() : candidate.details;
  res.status(statusCode).json({
    error: {
      message: statusCode >= 500 && env.NODE_ENV === "production" ? "Internal server error" : err.message,
      ...(details === undefined ? {} : { details }),
    },
  });
};
