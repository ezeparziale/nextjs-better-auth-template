import type { BetterAuthPlugin } from "better-auth"
import { createValidationOptions } from "./call"
import { RBAC_ERROR_CODES } from "./error-codes"
import * as routes from "./routes"
import { schema } from "./schema"
import { seedRBACData } from "./seed"
import { RBACPluginOptions } from "./types"

const DEFAULT_PERMISSION_KEY_PATTERN = /^[a-z0-9_]+:[a-z0-9_]+$/i
const DEFAULT_ROLE_KEY_PATTERN = /^[a-z0-9_]+$/i

export const rbacPlugin = <O extends RBACPluginOptions>(options?: O | undefined) => {
  const opts = {
    // Pagination
    defaultLimit: 10,
    maxLimit: 100,
    defaultOffset: 0,
    // Seed
    seedPermissions: [],
    seedRoles: [],
    // Permission key format
    minPermissionKeyLength: 3,
    maxPermissionKeyLength: 50,
    permissionKeyPattern: DEFAULT_PERMISSION_KEY_PATTERN,
    permissionKeyErrorMessage: undefined,
    // Role key format
    minRoleKeyLength: 3,
    maxRoleKeyLength: 50,
    roleKeyPattern: DEFAULT_ROLE_KEY_PATTERN,
    roleKeyErrorMessage: undefined,
    disableEndpoints: [],
    ...options,
  }

  return {
    id: "rbac",
    schema: schema,
    hooks: {
      after: [],
    },
    endpoints: {
      // Assignments
      assignPermissionToRole: routes.assignPermissionToRole(opts),
      removePermissionFromRole: routes.removePermissionFromRole(opts),
      assignRoleToUser: routes.assignRoleToUser(opts),
      removeRoleFromUser: routes.removeRoleFromUser(opts),

      // Permissions
      listPermissions: routes.listPermissions(opts),
      getPermission: routes.getPermission(opts),
      createPermission: routes.createPermission(opts),
      updatePermission: routes.updatePermission(opts),
      deletePermission: routes.deletePermission(opts),
      getPermissionsOptions: routes.getPermissionsOptions(opts),
      getPermissionRoles: routes.getPermissionRoles(opts),

      // Queries
      checkPermission: routes.checkPermission(opts),
      hasPermission: routes.hasPermission(opts),

      // Roles
      listRoles: routes.listRoles(opts),
      getRole: routes.getRole(opts),
      createRole: routes.createRole(opts),
      updateRole: routes.updateRole(opts),
      deleteRole: routes.deleteRole(opts),
      getRolesOptions: routes.getRolesOptions(opts),
      getRolePermissions: routes.getRolePermissions(opts),

      // Users
      getUserRoles: routes.getUserRoles(opts),
      getUserPermissions: routes.getUserPermissions(opts),
    },
    $ERROR_CODES: RBAC_ERROR_CODES,
    options,
    async init(ctx) {
      // Seed RBAC data if options are provided
      if (opts && (opts.seedPermissions || opts.seedRoles)) {
        await seedRBACData(ctx, opts, createValidationOptions(opts))
      }
    },
  } satisfies BetterAuthPlugin
}
