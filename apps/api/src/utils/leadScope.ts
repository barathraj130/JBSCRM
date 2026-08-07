import { prisma } from "@/lib/prisma";
import type { Role } from "@indiamart-crm/shared";

export interface RequestingUser {
  id: string;
  role: Role;
}

/**
 * Returns the set of user ids whose leads the requesting user may see/act on,
 * or `null` if the user has unrestricted (admin) visibility.
 */
export async function getVisibleUserIds(user: RequestingUser): Promise<string[] | null> {
  if (user.role === "ADMIN") return null;

  if (user.role === "SALES_MANAGER") {
    const reports = await prisma.user.findMany({ where: { managerId: user.id }, select: { id: true } });
    return [user.id, ...reports.map((r) => r.id)];
  }

  return [user.id];
}
