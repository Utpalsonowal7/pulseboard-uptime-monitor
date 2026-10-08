import type { RequestHandler } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import * as authService from "../services/auth.service.js";
import { createCsrfToken, isValidCsrfToken, CSRF_COOKIE } from "../middleware/csrf.js";

const isProduction = env.NODE_ENV === "production";
const accessCookie = authService.cookieNames().access;
const refreshCookie = authService.cookieNames().refresh;
const cookieBase = { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" as const : "lax" as const };
const csrfCookieBase = { ...cookieBase, path: "/", maxAge: 12 * 60 * 60 * 1000 };
function setSessionCookies(res: Parameters<RequestHandler>[1], issued: authService.IssuedSession): void {
  res.cookie(accessCookie, issued.accessToken, { ...cookieBase, path: "/", maxAge: 15 * 60 * 1000 });
  res.cookie(refreshCookie, issued.refreshToken, { ...cookieBase, path: "/api/auth", maxAge: 30 * 24 * 60 * 60 * 1000 });
}
function clearSessionCookies(res: Parameters<RequestHandler>[1]): void {
  res.clearCookie(accessCookie, { ...cookieBase, path: "/" });
  res.clearCookie(refreshCookie, { ...cookieBase, path: "/api/auth" });
}
function metadata(req: Parameters<RequestHandler>[0]) {
  const userAgent = req.get("user-agent");
  const ipAddress = req.ip;
  return { ...(userAgent ? { userAgent } : {}), ...(ipAddress ? { ipAddress } : {}) };
}

export const csrf: RequestHandler = (req, res) => {
  const current = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const token = current && isValidCsrfToken(current) ? current : createCsrfToken();
  res.cookie(CSRF_COOKIE, token, csrfCookieBase);
  res.setHeader("Cache-Control", "no-store");
  res.json({ data: { csrfToken: token } });
};

export const register: RequestHandler = async (req, res) => {
  const input = z.object({
    name: z.string().trim().min(2).max(100),
    email: z.email().max(255),
    password: z.string().min(10).max(72).refine((value) => Buffer.byteLength(value, "utf8") <= 72, "Password must be 72 bytes or fewer."),
  }).strict().parse(req.body);
  const result = await authService.register(input, metadata(req));
  setSessionCookies(res, result);
  res.status(201).json({ data: { user: result.user } });
};
export const login: RequestHandler = async (req, res) => {
  const input = z.object({ email: z.email().max(255), password: z.string().min(1).max(72) }).strict().parse(req.body);
  const result = await authService.login(input, metadata(req));
  setSessionCookies(res, result);
  res.json({ data: { user: result.user } });
};
export const refresh: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies?.[refreshCookie] as string | undefined;
  if (!refreshToken) { res.status(401).json({ error: { message: "Sign in to continue." } }); return; }
  const result = await authService.refresh(refreshToken);
  setSessionCookies(res, result);
  res.json({ data: { user: result.user } });
};
export const logout: RequestHandler = async (req, res) => {
  await authService.revokeSession(req.cookies?.[accessCookie] as string | undefined, req.cookies?.[refreshCookie] as string | undefined);
  clearSessionCookies(res);
  res.status(204).send();
};
export const me: RequestHandler = async (_req, res) => {
  const auth = res.locals.auth as { userId: string };
  res.json({ data: { user: await authService.getUserById(auth.userId) } });
};
