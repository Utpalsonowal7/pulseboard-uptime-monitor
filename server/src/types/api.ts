import type { Request } from "express";

export interface AsyncRequest extends Request {
  validatedBody?: unknown;
}
export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}
