import type { AuthContext, DBTransactionAdapter } from "better-auth"
import type {
  Permission,
  PermissionCreateInput,
  RBACPluginOptions,
  Role,
  RoleCreateInput,
  RolePermission,
  RolePermissionCreateInput,
} from "./types"
import { KeyValidationConfig, validateKey } from "./validation"

function validateSeedConfig(
  options: Required<Pick<RBACPluginOptions, "seedPermissions" | "seedRoles">>,
  validationOptions: KeyValidationConfig,
): void {
  const invalid: string[] = []

  for (const permission of options.seedPermissions ?? []) {
    try {
      validateKey("permission", permission.key, validationOptions)
    } catch {
      invalid.push(`permission "${permission.key}"`)
    }
  }

  for (const role of options.seedRoles ?? []) {
    try {
      validateKey("role", role.key, validationOptions)
    } catch {
      invalid.push(`role "${role.key}"`)
    }
  }

  if (invalid.length > 0) {
    throw new Error(
      `Invalid seed configuration: ${invalid.length} invalid key(s). ` +
        `Fix the seed options before starting the server, the seed will not run:\n` +
        invalid.map((entry) => `  - ${entry}`).join("\n"),
    )
  }
}

/**
 * Seeds permissions into the database if they don't already exist
 */
async function seedPermissions(
  db: DBTransactionAdapter,
  permissions: RBACPluginOptions["seedPermissions"],
) {
  if (!permissions || permissions.length === 0) return

  for (const permission of permissions) {
    // Check if permission already exists
    const existing = await db.findOne<Permission>({
      model: "permission",
      where: [{ field: "key", operator: "eq", value: permission.key }],
    })

    if (!existing) {
      await db.create<PermissionCreateInput, Permission>({
        model: "permission",
        data: {
          key: permission.key,
          name: permission.name,
          description: permission.description,
          isActive: permission.isActive ?? true,
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
) {
  if (!roles || roles.length === 0) return

  for (const role of roles) {
    // Check if role already exists
    const existing = await db.findOne<Role>({
      model: "role",
      where: [{ field: "key", operator: "eq", value: role.key }],
    })

    if (!existing) {
      const createdRole = await db.create<RoleCreateInput, Role>({
        model: "role",
        data: {
          key: role.key,
          name: role.name,
          description: role.description,
          isActive: role.isActive ?? true,
          assignOnJoin: role.assignOnJoin ?? false,
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
      await db.create<RolePermissionCreateInput, RolePermission>({
        model: "rolePermission",
        data: {
          roleId: roleId,
          permissionId: permission.id,
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
  validateSeedConfig(options, validationOptions)

  try {
    // Runs the whole seed within a transaction so a mid-way failure rolls everything back.
    // Falls back to sequential execution when the adapter has no transactions.
    const runSeed = async (db: DBTransactionAdapter) => {
      // Seed permissions first (roles depend on them)
      await seedPermissions(db, options.seedPermissions)

      // Then seed roles with their permission associations
      await seedRoles(db, options.seedRoles)
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
