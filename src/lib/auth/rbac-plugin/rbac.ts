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
      rbacAssignPermissionToRole: routes.rbacAssignPermissionToRole(opts),
      rbacRemovePermissionFromRole: routes.rbacRemovePermissionFromRole(opts),
      rbacAssignRoleToUser: routes.rbacAssignRoleToUser(opts),
      rbacRemoveRoleFromUser: routes.rbacRemoveRoleFromUser(opts),

      // Permissions
      rbacListPermissions: routes.rbacListPermissions(opts),
      rbacGetPermission: routes.rbacGetPermission(opts),
      rbacCreatePermission: routes.rbacCreatePermission(opts),
      rbacUpdatePermission: routes.rbacUpdatePermission(opts),
      rbacDeletePermission: routes.rbacDeletePermission(opts),
      rbacGetPermissionsOptions: routes.rbacGetPermissionsOptions(opts),
      rbacGetPermissionRoles: routes.rbacGetPermissionRoles(opts),

      // Queries
      rbacCheckPermission: routes.rbacCheckPermission(opts),
      rbacHasPermission: routes.rbacHasPermission(opts),

      // Roles
      rbacListRoles: routes.rbacListRoles(opts),
      rbacGetRole: routes.rbacGetRole(opts),
      rbacCreateRole: routes.rbacCreateRole(opts),
      rbacUpdateRole: routes.rbacUpdateRole(opts),
      rbacDeleteRole: routes.rbacDeleteRole(opts),
      rbacGetRolesOptions: routes.rbacGetRolesOptions(opts),
      rbacGetRolePermissions: routes.rbacGetRolePermissions(opts),
      rbacGetRoleUsers: routes.rbacGetRoleUsers(opts),

      // Users
      rbacGetUserRoles: routes.rbacGetUserRoles(opts),
      rbacGetUserPermissions: routes.rbacGetUserPermissions(opts),
      rbacSetUserRoles: routes.rbacSetUserRoles(opts),
      rbacGetUsersOptions: routes.rbacGetUsersOptions(opts),
      rbacUpdateUser: routes.rbacUpdateUser(opts),
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
