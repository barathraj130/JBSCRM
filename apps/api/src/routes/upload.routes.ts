import { Router } from "express";
import { requireAuth } from "@/middleware/auth";
import { upload } from "@/middleware/upload";
import { storageProvider } from "@/lib/storage";
import { HttpError } from "@/middleware/errorHandler";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "No file uploaded");
    const { url } = await storageProvider.saveFile(req.file.buffer, req.file.originalname);
    res.status(201).json({ url });
  })
);

export default router;
