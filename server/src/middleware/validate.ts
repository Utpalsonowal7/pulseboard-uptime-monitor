import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export function validateBody(schema: ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ error: { message: "Request validation failed", details: result.error.flatten() } });
      return;
    }
    res.locals.validatedBody = result.data;
    next();
  };
}
