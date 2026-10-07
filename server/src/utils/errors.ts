import type { AppError } from "../types/api.js";

export function httpError(statusCode: number, message: string, details?: unknown): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  if (details !== undefined) error.details = details;
  return error;
}
