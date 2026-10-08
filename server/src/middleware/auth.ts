import type { RequestHandler } from "express";
import { authenticateAccessToken, cookieNames } from "../services/auth.service.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.[cookieNames().access] as string | undefined;
    if (!token) {
      res.status(401).json({ error: { message: "Sign in to continue." } });
      return;
    }
    res.locals.auth = await authenticateAccessToken(token);
    next();
  } catch (error) { next(error); }
};
