import type { Response } from "express";
import { z } from "zod";
import * as authService from "@/services/auth.service";
import type { AuthedRequest } from "@/middleware/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function loginHandler(req: AuthedRequest, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const result = await authService.login(email, password, req.ip, req.headers["user-agent"]);
  res.json(result);
}

export async function logoutHandler(req: AuthedRequest, res: Response) {
  await authService.logout(req.user!.id, req.ip, req.headers["user-agent"]);
  res.status(204).send();
}

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function refreshHandler(req: AuthedRequest, res: Response) {
  const { refreshToken } = refreshSchema.parse(req.body);
  const result = await authService.refresh(refreshToken);
  res.json(result);
}

export async function meHandler(req: AuthedRequest, res: Response) {
  const user = await authService.getMe(req.user!.id);
  res.json(user);
}
