import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getVisibleUserIds, type RequestingUser } from "@/utils/leadScope";
import { toAuditLogDTO } from "@/utils/mappers";
import type { AuditLogFilter, AuditLogPageDTO } from "@indiamart-crm/shared";

export async function listAuditLogs(actor: RequestingUser, filter: AuditLogFilter): Promise<AuditLogPageDTO> {
  // Access is already gated by requireCapability("audit.view") at the route level,
  // which respects per-user permission overrides — no role check needed here.
  const visibleUserIds = await getVisibleUserIds(actor);
  const where: Prisma.AuditLogWhereInput = {};
  if (visibleUserIds) where.userId = { in: visibleUserIds };
  if (filter.userId) where.userId = filter.userId;
  if (filter.action) where.action = filter.action;
  if (filter.objectType) where.objectType = filter.objectType;
  if (filter.from || filter.to) {
    where.createdAt = {};
    if (filter.from) where.createdAt.gte = new Date(filter.from);
    if (filter.to) where.createdAt.lte = new Date(filter.to);
  }

  const page = filter.page ?? 1;
  const pageSize = Math.min(filter.pageSize ?? 50, 200);

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { items: items.map(toAuditLogDTO), total, page, pageSize };
}
