import { Router } from "express";
import { z } from "zod";
import { publicStatus } from "../controllers/monitor.controller.js";
const router = Router();
router.get("/:slug", (req, res, next) => {
  if (!z.string().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).safeParse(req.params.slug).success) {
    res.status(400).json({ error: { message: "Invalid status page slug" } });
    return;
  }
  next();
}, publicStatus);
export default router;
