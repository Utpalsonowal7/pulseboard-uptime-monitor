import type { RequestHandler } from "express";
import { env } from "../config/env.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
export const sameOrigin: RequestHandler = (req, res, next) => {
  if (safeMethods.has(req.method)) { next(); return; }
  const origin = req.get("origin");
  if (origin && origin !== env.FRONTEND_URL) {
    res.status(403).json({ error: { message: "Request origin is not allowed." } });
    return;
  }
  next();
};
