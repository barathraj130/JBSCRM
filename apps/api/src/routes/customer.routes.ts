import { Router } from "express";
import { addNoteHandler, getHandler, lookupHandler, updateHandler } from "@/controllers/customer.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/lookup", asyncHandler(lookupHandler));
router.get("/:id", asyncHandler(getHandler));
router.patch("/:id", asyncHandler(updateHandler));
router.post("/:id/notes", asyncHandler(addNoteHandler));

export default router;
