import type { RbacAdapter } from "./utils"

/**
 * Resolves whether `userId` ends up with the permission identified by
 * `permissionKey`, through any of their active roles.
 *
 * Costs four queries regardless of how many roles the user has: the permission,
 * the user's role rows, the still-active roles, and a single lookup of the
 * matching join rows. Inactive roles and inactive or missing permissions are
 * treated as "no access".
 */
export async function userHasPermissionKey(
  adapter: RbacAdapter,
  userId: string,
  permissionKey: string,
): Promise<boolean> {
  const permission = await adapter.findOne<{ id: string }>({
    model: "permission",
    where: [
      { field: "key", value: permissionKey },
      { field: "isActive", value: true },
    ],
  })

  if (!permission) return false

  const userRoles = await adapter.findMany<{ roleId: string }>({
    model: "userRole",
    where: [{ field: "userId", value: userId }],
    select: ["roleId"],
  })

  if (userRoles.length === 0) return false

  const activeRoles = await adapter.findMany<{ id: string }>({
    model: "role",
    where: [
      { field: "id", operator: "in", value: userRoles.map((ur) => ur.roleId) },
      { field: "isActive", value: true },
    ],
    select: ["id"],
  })

  if (activeRoles.length === 0) return false

  const granted = await adapter.findMany<{ id: string }>({
    model: "rolePermission",
    where: [
      { field: "roleId", operator: "in", value: activeRoles.map((role) => role.id) },
      { field: "permissionId", value: permission.id },
    ],
    select: ["id"],
    limit: 1,
  })

  return granted.length > 0
}
