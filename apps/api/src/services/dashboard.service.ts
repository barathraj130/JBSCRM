import { prisma } from "@/lib/prisma";
import { LeadStatus, type DashboardSummaryDTO } from "@indiamart-crm/shared";

export async function getDashboardSummary(): Promise<DashboardSummaryDTO> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalLeads, newLeadsToday, pendingFollowUps, statusCounts, wonLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.followUp.count({ where: { status: "PENDING" } }),
    prisma.lead.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.lead.findMany({ where: { status: "WON" }, select: { dealValue: true } }),
  ]);

  const leadsByStatus = Object.values(LeadStatus).reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {} as Record<LeadStatus, number>);

  for (const row of statusCounts) {
    leadsByStatus[row.status as LeadStatus] = row._count.status;
  }

  const closedDeals = leadsByStatus.WON;
  const lostDeals = leadsByStatus.LOST;
  const revenue = wonLeads.reduce((sum, l) => sum + Number(l.dealValue ?? 0), 0);
  const decidedLeads = closedDeals + lostDeals;
  const conversionRate = decidedLeads > 0 ? Math.round((closedDeals / decidedLeads) * 1000) / 10 : 0;

  const trendDays = 7;
  const dailyLeadTrend: { date: string; count: number }[] = [];
  for (let i = trendDays - 1; i >= 0; i--) {
    const dayStart = new Date(startOfToday);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const count = await prisma.lead.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } });
    dailyLeadTrend.push({ date: dayStart.toISOString().slice(0, 10), count });
  }

  return {
    totalLeads,
    newLeadsToday,
    pendingFollowUps,
    closedDeals,
    lostDeals,
    revenue,
    conversionRate,
    leadsByStatus,
    dailyLeadTrend,
  };
}
