import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import type { RequestingUser } from "@/utils/leadScope";
import type { NotificationDTO, NotificationType } from "@indiamart-crm/shared";

function toDTO(n: {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: Date;
}): NotificationDTO {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    entityType: n.entityType,
    entityId: n.entityId,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  options?: { body?: string; entityType?: string; entityId?: string }
) {
  await prisma.notification.create({
    data: { userId, type, title, body: options?.body, entityType: options?.entityType, entityId: options?.entityId },
  });
}

async function syncFollowUpReminders(userId: string) {
  const overdue = await prisma.followUp.findMany({
    where: { userId, status: "PENDING", dueAt: { lte: new Date() } },
    include: { lead: { include: { customer: true } } },
  });

  for (const followUp of overdue) {
    const existing = await prisma.notification.findFirst({
      where: { userId, type: "FOLLOW_UP_REMINDER", entityType: "followup", entityId: followUp.id },
    });
    if (!existing) {
      await createNotification(userId, "FOLLOW_UP_REMINDER", `Follow-up due: ${followUp.lead.customer.name}`, {
        body: followUp.notes ?? undefined,
        entityType: "customer",
        entityId: followUp.lead.customerId,
      });
    }
  }
}

export async function listNotifications(actor: RequestingUser): Promise<NotificationDTO[]> {
  await syncFollowUpReminders(actor.id);
  const notifications = await prisma.notification.findMany({
    where: { userId: actor.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return notifications.map(toDTO);
}

export async function markRead(actor: RequestingUser, id: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== actor.id) {
    throw new HttpError(404, "Notification not found");
  }
  await prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllRead(actor: RequestingUser) {
  await prisma.notification.updateMany({ where: { userId: actor.id, isRead: false }, data: { isRead: true } });
}
