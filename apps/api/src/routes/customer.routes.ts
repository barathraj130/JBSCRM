import { Router } from "express";
import {
  addNoteHandler,
  editNoteHandler,
  getHandler,
  listCallsHandler,
  logCallHandler,
  lookupHandler,
  timelineHandler,
  updateHandler,
} from "@/controllers/customer.controller";
import { requireAuth } from "@/middleware/auth";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/lookup", asyncHandler(lookupHandler));
router.get("/:id", asyncHandler(getHandler));
router.patch("/:id", asyncHandler(updateHandler));
router.post("/:id/notes", asyncHandler(addNoteHandler));
router.patch("/:id/notes/:noteId", asyncHandler(editNoteHandler));
router.get("/:id/timeline", asyncHandler(timelineHandler));
router.get("/:id/calls", asyncHandler(listCallsHandler));
router.post("/:id/calls", asyncHandler(logCallHandler));

export default router;
