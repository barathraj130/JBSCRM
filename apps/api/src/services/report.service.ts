import { prisma } from "@/lib/prisma";
import { getVisibleUserIds, type RequestingUser } from "@/utils/leadScope";
import { toEvidenceDTO } from "@/utils/mappers";
import type { ReportSummaryDTO } from "@indiamart-crm/shared";

export interface ReportFilter {
  from: Date;
  to: Date;
}

export async function getReportSummary(actor: RequestingUser, filter: ReportFilter): Promise<ReportSummaryDTO> {
  const visibleUserIds = await getVisibleUserIds(actor);

  const leads = await prisma.lead.findMany({
    where: {
      createdAt: { gte: filter.from, lte: filter.to },
      ...(visibleUserIds ? { assignedToId: { in: visibleUserIds } } : {}),
    },
    include: { assignedTo: true },
  });

  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === "WON");
  const lostLeads = leads.filter((l) => l.status === "LOST");
  const revenue = wonLeads.reduce((sum, l) => sum + Number(l.dealValue ?? 0), 0);
  const decided = wonLeads.length + lostLeads.length;
  const conversionRate = decided > 0 ? Math.round((wonLeads.length / decided) * 1000) / 10 : 0;

  const employeeIds = Array.from(new Set(leads.map((l) => l.assignedToId).filter((id): id is string => !!id)));
  const employees = employeeIds.length
    ? await prisma.user.findMany({ where: { id: { in: employeeIds } }, select: { id: true, name: true } })
    : [];

  const completedFollowUps = employeeIds.length
    ? await prisma.followUp.findMany({
        where: { userId: { in: employeeIds }, status: "COMPLETED", updatedAt: { gte: filter.from, lte: filter.to } },
        select: { userId: true },
      })
    : [];

  const byEmployee = employees.map((emp) => {
    const empLeads = leads.filter((l) => l.assignedToId === emp.id);
    const won = empLeads.filter((l) => l.status === "WON");
    const lost = empLeads.filter((l) => l.status === "LOST");
    const empRevenue = won.reduce((sum, l) => sum + Number(l.dealValue ?? 0), 0);
    const empDecided = won.length + lost.length;
    return {
      userId: emp.id,
      name: emp.name,
      leadsAssigned: empLeads.length,
      leadsWon: won.length,
      leadsLost: lost.length,
      revenue: empRevenue,
      conversionRate: empDecided > 0 ? Math.round((won.length / empDecided) * 1000) / 10 : 0,
      followUpsCompleted: completedFollowUps.filter((f) => f.userId === emp.id).length,
    };
  });
  byEmployee.sort((a, b) => b.revenue - a.revenue);

  const bySource = countBy(leads, (l) => l.source);
  const byStatus = countBy(leads, (l) => l.status);

  return {
    from: filter.from.toISOString(),
    to: filter.to.toISOString(),
    totalLeads,
    wonDeals: wonLeads.length,
    lostDeals: lostLeads.length,
    revenue,
    conversionRate,
    byEmployee,
    bySource,
    byStatus,
  };
}

export async function getEvidenceReportRows(actor: RequestingUser, filter: ReportFilter) {
  const visibleUserIds = await getVisibleUserIds(actor);
  const rows = await prisma.evidence.findMany({
    where: {
      occurredAt: { gte: filter.from, lte: filter.to },
      ...(visibleUserIds ? { employeeId: { in: visibleUserIds } } : {}),
    },
    include: { employee: true },
    orderBy: { occurredAt: "desc" },
  });
  return rows.map(toEvidenceDTO);
}

function countBy<T>(items: T[], key: (item: T) => string): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
