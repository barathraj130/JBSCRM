import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface AuditContext {
  oldValue?: unknown;
  newValue?: unknown;
  source?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Writes to both the entity-scoped ActivityLog (used for per-customer/lead feeds)
 * and the stricter, append-only AuditLog (denormalized actor identity, old/new value).
 * No route ever exposes an update/delete for AuditLog rows.
 */
export async function logActivity(
  entityType: string,
  entityId: string,
  userId: string | null,
  action: string,
  metadata?: unknown,
  audit?: AuditContext
) {
  let actorName = "System";
  let actorEmail: string | null = null;
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
    if (user) {
      actorName = user.name;
      actorEmail = user.email;
    }
  }

  const [activity] = await Promise.all([
    prisma.activityLog.create({
      data: { entityType, entityId, userId, action, metadata: metadata as Prisma.InputJsonValue | undefined },
    }),
    prisma.auditLog.create({
      data: {
        userId,
        actorName,
        actorEmail,
        action,
        objectType: entityType,
        objectId: entityId,
        oldValue: (audit?.oldValue ?? null) as Prisma.InputJsonValue | undefined,
        newValue: (audit?.newValue ?? metadata ?? null) as Prisma.InputJsonValue | undefined,
        source: audit?.source ?? "web",
        ipAddress: audit?.ipAddress ?? null,
        userAgent: audit?.userAgent ?? null,
      },
    }),
  ]);

  return activity;
}
