import { Router } from "express";
import {
  createTemplateHandler,
  deleteTemplateHandler,
  listTemplatesHandler,
  updateTemplateHandler,
} from "@/controllers/admin.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listTemplatesHandler));
router.post("/", requireRole("ADMIN"), asyncHandler(createTemplateHandler));
router.patch("/:id", requireRole("ADMIN"), asyncHandler(updateTemplateHandler));
router.delete("/:id", requireRole("ADMIN"), asyncHandler(deleteTemplateHandler));

export default router;
