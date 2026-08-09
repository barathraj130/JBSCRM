import { Router } from "express";
import { createHandler, deleteHandler, listHandler, updateHandler } from "@/controllers/category.controller";
import { requireAuth, requireRole } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listHandler));
router.post("/", requireRole("ADMIN"), asyncHandler(createHandler));
router.patch("/:id", requireRole("ADMIN"), asyncHandler(updateHandler));
router.delete("/:id", requireRole("ADMIN"), asyncHandler(deleteHandler));

export default router;
