import { Router } from "express";
import { bulkUpdateHandler, createHandler, listHandler, updateHandler } from "@/controllers/lead.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listHandler));
router.post("/", asyncHandler(createHandler));
router.patch("/bulk", asyncHandler(bulkUpdateHandler));
router.patch("/:id", asyncHandler(updateHandler));

export default router;
