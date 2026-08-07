import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function logActivity(
  entityType: string,
  entityId: string,
  userId: string | null,
  action: string,
  metadata?: unknown
) {
  return prisma.activityLog.create({
    data: { entityType, entityId, userId, action, metadata: metadata as Prisma.InputJsonValue | undefined },
  });
}
