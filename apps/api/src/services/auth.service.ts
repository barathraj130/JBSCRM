import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/utils/jwt";
import { HttpError } from "@/middleware/errorHandler";
import { logActivity } from "@/services/activityLog.service";
import type { Role } from "@indiamart-crm/shared";

export async function login(email: string, password: string, ipAddress?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new HttpError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid email or password");
  }

  const payload = { sub: user.id, role: user.role as Role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await logActivity("user", user.id, user.id, "login", undefined, { source: "web", ipAddress, userAgent });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive },
  };
}

export async function logout(userId: string, ipAddress?: string, userAgent?: string) {
  await logActivity("user", userId, userId, "logout", undefined, { source: "web", ipAddress, userAgent });
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new HttpError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    throw new HttpError(401, "User not found or inactive");
  }

  const newPayload = { sub: user.id, role: user.role as Role };
  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload),
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "User not found");
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive };
}
