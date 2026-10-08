import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../config/database.js";
import { env } from "../config/env.js";
import { httpError } from "../utils/errors.js";

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COOKIE_ACCESS = "access_token";
const COOKIE_REFRESH = "refresh_token";

export interface PublicUser { id: string; name: string; email: string; createdAt: Date }
interface TokenClaims extends JwtPayload { sub: string; sid: string; tokenType: "access" | "refresh" }
export interface IssuedSession { user: PublicUser; accessToken: string; refreshToken: string }

function tokenHash(token: string): string { return createHash("sha256").update(token).digest("hex"); }
function matchesHash(left: string, right: string): boolean {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
function signToken(userId: string, sessionId: string, tokenType: TokenClaims["tokenType"], expiresInSeconds: number): string {
  return jwt.sign({ sid: sessionId, tokenType }, env.JWT_SECRET, { subject: userId, expiresIn: expiresInSeconds });
}
function verifyToken(token: string, expectedType: TokenClaims["tokenType"]): TokenClaims {
  try {
    const claims = jwt.verify(token, env.JWT_SECRET);
    if (typeof claims === "string" || !claims.sub || !claims.sid || claims.tokenType !== expectedType) throw new Error("Invalid token");
    return claims as TokenClaims;
  } catch {
    throw httpError(401, "Your session is invalid or expired. Please sign in again.");
  }
}
function publicUser(user: { id: string; name: string; email: string; createdAt: Date }): PublicUser {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt };
}

export async function register(input: { name: string; email: string; password: string }, metadata: { userAgent?: string; ipAddress?: string }): Promise<IssuedSession> {
  const email = input.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) throw httpError(409, "An account with this email already exists.");
  if (Buffer.byteLength(input.password, "utf8") > 72) throw httpError(400, "Password must be 72 bytes or fewer.");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const userId = randomUUID();
  const sessionId = randomUUID();
  const now = new Date();
  const refreshToken = signToken(userId, sessionId, "refresh", REFRESH_TTL_MS / 1000);
  const accessToken = signToken(userId, sessionId, "access", ACCESS_TTL_SECONDS);
  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: { id: userId, name: input.name.trim(), email, passwordHash } });
    await tx.session.create({ data: {
      id: sessionId, userId, refreshTokenHash: tokenHash(refreshToken), expiresAt: new Date(now.getTime() + REFRESH_TTL_MS),
      userAgent: metadata.userAgent?.slice(0, 500) ?? null, ipAddress: metadata.ipAddress ?? null,
    } });
    await tx.monitor.updateMany({ where: { userId: null }, data: { userId } });
    return user;
  });
  return { user: publicUser(created), accessToken, refreshToken };
}

export async function login(input: { email: string; password: string }, metadata: { userAgent?: string; ipAddress?: string }): Promise<IssuedSession> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw httpError(401, "Email or password is incorrect.");
  const sessionId = randomUUID();
  const now = new Date();
  const refreshToken = signToken(user.id, sessionId, "refresh", REFRESH_TTL_MS / 1000);
  const accessToken = signToken(user.id, sessionId, "access", ACCESS_TTL_SECONDS);
  await prisma.session.create({ data: {
    id: sessionId, userId: user.id, refreshTokenHash: tokenHash(refreshToken), expiresAt: new Date(now.getTime() + REFRESH_TTL_MS),
    userAgent: metadata.userAgent?.slice(0, 500) ?? null, ipAddress: metadata.ipAddress ?? null,
  } });
  return { user: publicUser(user), accessToken, refreshToken };
}

export async function refresh(refreshToken: string): Promise<IssuedSession> {
  const claims = verifyToken(refreshToken, "refresh");
  const session = await prisma.session.findUnique({ where: { id: claims.sid }, include: { user: true } });
  if (!session || session.userId !== claims.sub || session.revokedAt || session.expiresAt <= new Date()) {
    throw httpError(401, "Your session has expired. Please sign in again.");
  }
  const presentedHash = tokenHash(refreshToken);
  if (!matchesHash(session.refreshTokenHash, presentedHash)) {
    await prisma.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: new Date() } });
    throw httpError(401, "This session was already used. Please sign in again.");
  }
  const nextRefresh = signToken(session.userId, session.id, "refresh", REFRESH_TTL_MS / 1000);
  const nextAccess = signToken(session.userId, session.id, "access", ACCESS_TTL_SECONDS);
  const updated = await prisma.session.updateMany({
    where: { id: session.id, refreshTokenHash: session.refreshTokenHash, revokedAt: null, expiresAt: { gt: new Date() } },
    data: { refreshTokenHash: tokenHash(nextRefresh), expiresAt: new Date(Date.now() + REFRESH_TTL_MS) },
  });
  if (updated.count !== 1) {
    await prisma.session.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: new Date() } });
    throw httpError(401, "This session was already used. Please sign in again.");
  }
  return { user: publicUser(session.user), accessToken: nextAccess, refreshToken: nextRefresh };
}

export async function authenticateAccessToken(accessToken: string): Promise<{ userId: string; sessionId: string }> {
  const claims = verifyToken(accessToken, "access");
  const session = await prisma.session.findUnique({ where: { id: claims.sid }, select: { id: true, userId: true, revokedAt: true, expiresAt: true } });
  if (!session || session.userId !== claims.sub || session.revokedAt || session.expiresAt <= new Date()) {
    throw httpError(401, "Your session is invalid or expired. Please sign in again.");
  }
  return { userId: session.userId, sessionId: session.id };
}

export async function revokeSession(accessToken?: string, refreshToken?: string): Promise<void> {
  for (const [token, type] of [[accessToken, "access"], [refreshToken, "refresh"]] as const) {
    if (!token) continue;
    try {
      const claims = verifyToken(token, type);
      await prisma.session.updateMany({ where: { id: claims.sid, userId: claims.sub, revokedAt: null }, data: { revokedAt: new Date() } });
      return;
    } catch {
      // Try the other cookie; both are always cleared by the controller.
    }
  }
}

export async function getUserById(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, createdAt: true } });
  if (!user) throw httpError(401, "Your account is no longer available.");
  return user;
}

export function cookieNames() { return { access: COOKIE_ACCESS, refresh: COOKIE_REFRESH }; }
