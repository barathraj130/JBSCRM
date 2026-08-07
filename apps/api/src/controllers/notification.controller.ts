import type { Response } from "express";
import * as notificationService from "@/services/notification.service";
import type { AuthedRequest } from "@/middleware/auth";
import { HttpError } from "@/middleware/errorHandler";

export async function listHandler(req: AuthedRequest, res: Response) {
  const notifications = await notificationService.listNotifications(req.user!);
  res.json(notifications);
}

export async function markReadHandler(req: AuthedRequest, res: Response) {
  if (!req.params.id) throw new HttpError(400, "Missing notification id");
  await notificationService.markRead(req.user!, req.params.id);
  res.status(204).send();
}

export async function markAllReadHandler(req: AuthedRequest, res: Response) {
  await notificationService.markAllRead(req.user!);
  res.status(204).send();
}
