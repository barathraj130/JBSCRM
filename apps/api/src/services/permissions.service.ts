import { prisma } from "@/lib/prisma";
import { HttpError } from "@/middleware/errorHandler";
import { logActivity } from "@/services/activityLog.service";
import { PERMISSION_KEYS, ROLE_DEFAULT_PERMISSIONS, type PermissionKey } from "@indiamart-crm/shared";
import type { EmployeePermissionsDTO, Role, UpdateEmployeePermissionsInput } from "@indiamart-crm/shared";

export async function getEffectivePermissions(userId: string, role: Role): Promise<Set<PermissionKey>> {
  const defaults = new Set(ROLE_DEFAULT_PERMISSIONS[role]);
  const overrides = await prisma.userPermission.findMany({ where: { userId } });
  for (const o of overrides) {
    if (!PERMISSION_KEYS.includes(o.key as PermissionKey)) continue;
    if (o.granted) defaults.add(o.key as PermissionKey);
    else defaults.delete(o.key as PermissionKey);
  }
  return defaults;
}

export async function hasCapability(userId: string, role: Role, key: PermissionKey): Promise<boolean> {
  if (role === "ADMIN") return true;
  const effective = await getEffectivePermissions(userId, role);
  return effective.has(key);
}

export async function getEmployeePermissions(userId: string): Promise<EmployeePermissionsDTO> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "Employee not found");

  const overrides = await prisma.userPermission.findMany({ where: { userId } });
  const effective = await getEffectivePermissions(userId, user.role);

  return {
    userId,
    role: user.role,
    defaults: ROLE_DEFAULT_PERMISSIONS[user.role],
    overrides: overrides.map((o) => ({ key: o.key as PermissionKey, granted: o.granted })),
    effective: Array.from(effective),
  };
}

export async function updateEmployeePermissions(actorId: string, userId: string, input: UpdateEmployeePermissionsInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, "Employee not found");

  for (const override of input) {
    if (!PERMISSION_KEYS.includes(override.key)) {
      throw new HttpError(400, `Unknown permission key: ${override.key}`);
    }
  }

  await prisma.$transaction(
    input.map((override) =>
      prisma.userPermission.upsert({
        where: { userId_key: { userId, key: override.key } },
        create: { userId, key: override.key, granted: override.granted, updatedById: actorId },
        update: { granted: override.granted, updatedById: actorId },
      })
    )
  );

  await logActivity("user", userId, actorId, "permissions_changed", { overrides: input });

  return getEmployeePermissions(userId);
}
