import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";

export const CSRF_COOKIE = "csrf_token";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function createCsrfToken(now = Date.now()): string {
  const nonce = randomBytes(32).toString("base64url");
  const expiresAt = String(now + TOKEN_TTL_MS);
  const payload = `${nonce}.${expiresAt}`;
  const signature = createHmac("sha256", env.JWT_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function equalText(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function isValidCsrfToken(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3 || !/^\d+$/.test(parts[1] ?? "")) return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", env.JWT_SECRET).update(payload).digest("base64url");
  return equalText(parts[2] ?? "", expected);
}

export const csrfProtection: RequestHandler = (req, res, next) => {
  if (safeMethods.has(req.method)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.get("x-csrf-token");
  if (typeof cookieToken !== "string" || typeof headerToken !== "string" ||
      !equalText(cookieToken, headerToken) || !isValidCsrfToken(cookieToken)) {
    res.status(403).json({ error: { message: "CSRF token is missing, invalid, or expired." } });
    return;
  }
  next();
};
