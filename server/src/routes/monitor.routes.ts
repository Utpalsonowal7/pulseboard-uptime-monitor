import { Router } from "express";
import { z } from "zod";
import * as controller from "../controllers/monitor.controller.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);
router.use("/:id", (req, res, next) => {
  if (!z.uuid().safeParse(req.params.id).success) {
    res.status(400).json({ error: { message: "Monitor id must be a valid UUID" } });
    return;
  }
  next();
});
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const monitorSchema = z.object({
  name: z.string().trim().min(2).max(100),
  url: z.string().trim().url().max(2048).refine((value) => ["http:", "https:"].includes(new URL(value).protocol), "Only HTTP and HTTPS URLs are allowed"),
  slug: z.string().trim().min(2).max(80).regex(slugPattern, "Use lowercase letters, numbers, and hyphens"),
  enabled: z.boolean().optional(),
}).strict();
const updateSchema = monitorSchema.partial().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

router.get("/", controller.list);
router.post("/", validateBody(monitorSchema), controller.create);
router.get("/:id/checks", controller.checks);
router.get("/:id/stats", controller.stats);
router.get("/:id/incidents", controller.incidents);
router.get("/:id", controller.getById);
router.patch("/:id", validateBody(updateSchema), controller.update);
router.delete("/:id", controller.remove);
export default router;
