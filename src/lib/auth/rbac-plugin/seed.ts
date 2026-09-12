import type { AuthContext, DBTransactionAdapter } from "better-auth"
import type { Permission, RBACPluginOptions, Role, RolePermission } from "./types"
import { KeyValidationConfig, validateKey } from "./validation"

/**
 * Seeds permissions into the database if they don't already exist
 */
async function seedPermissions(
  db: DBTransactionAdapter,
  permissions: RBACPluginOptions["seedPermissions"],
  validationOptions: KeyValidationConfig,
) {
  if (!permissions || permissions.length === 0) return

  for (const permission of permissions) {
    try {
      validateKey("permission", permission.key, validationOptions)
    } catch (error) {
      console.error(`Invalid permission key "${permission.key}":`, error)
      continue
    }

    // Check if permission already exists
    const existing = await db.findOne<Permission>({
      model: "permission",
      where: [{ field: "key", operator: "eq", value: permission.key }],
    })

    if (!existing) {
      await db.create<Permission>({
        model: "permission",
        data: {
          key: permission.key,
          name: permission.name,
          description: permission.description || undefined,
          isActive: permission.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "system",
          updatedBy: "system",
        },
      })
      console.log(`Permission created: ${permission.key}`)
    }
  }
}

/**
 * Seeds roles into the database if they don't already exist
 * Also associates permissions with roles
 */
async function seedRoles(
  db: DBTransactionAdapter,
  roles: RBACPluginOptions["seedRoles"],
  validationOptions: KeyValidationConfig,
) {
  if (!roles || roles.length === 0) return

  for (const role of roles) {
    try {
      validateKey("role", role.key, validationOptions)
    } catch (error) {
      console.error(`Invalid role key "${role.key}":`, error)
      continue
    }
    // Check if role already exists
    const existing = await db.findOne<Role>({
      model: "role",
      where: [{ field: "key", operator: "eq", value: role.key }],
    })

    if (!existing) {
      const createdRole = await db.create<Role>({
        model: "role",
        data: {
          key: role.key,
          name: role.name,
          description: role.description || undefined,
          isActive: role.isActive ?? true,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "system",
          updatedBy: "system",
        },
      })
      console.log(`Role created: ${role.key}`)

      // Associate permissions with the role
      if (role.permissions && role.permissions.length > 0) {
        await associatePermissionsToRole(db, createdRole.id, role.permissions)
      }
    }
  }
}

/**
 * Associates permissions to a role by permission keys
 */
async function associatePermissionsToRole(
  db: DBTransactionAdapter,
  roleId: string,
  permissionKeys: string[],
) {
  for (const permissionKey of permissionKeys) {
    // Find the permission by key
    const permission = await db.findOne<Permission>({
      model: "permission",
      where: [{ field: "key", operator: "eq", value: permissionKey }],
    })

    if (permission) {
      await db.create<RolePermission>({
        model: "rolePermission",
        data: {
          roleId: roleId,
          permissionId: permission.id,
          createdAt: new Date(),
        },
      })
      console.log(`Permission assigned: ${permissionKey}`)
    } else {
      console.warn(`Permission not found: ${permissionKey} (skipping association)`)
    }
  }
}

/**
 * Main function to seed all RBAC data
 */
export async function seedRBACData(
  ctx: AuthContext,
  options: Required<Pick<RBACPluginOptions, "seedPermissions" | "seedRoles">>,
  validationOptions: KeyValidationConfig,
) {
  try {
    // Runs the whole seed within a transaction so a mid-way failure rolls everything back.
    // Falls back to sequential execution when the adapter has no transactions.
    const runSeed = async (db: DBTransactionAdapter) => {
      // Seed permissions first (roles depend on them)
      await seedPermissions(db, options.seedPermissions, validationOptions)

      // Then seed roles with their permission associations
      await seedRoles(db, options.seedRoles, validationOptions)
    }

    if (typeof ctx.adapter.transaction === "function") {
      await ctx.adapter.transaction(runSeed)
    } else {
      await runSeed(ctx.adapter)
    }
  } catch (error) {
    console.error("Error seeding RBAC data:", error)
    throw error
  }
}
