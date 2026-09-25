import type { SystemProtectionMode } from "./system-protection"

export type Permission = {
  id: string
  name: string
  key: string
  description: string
  isActive: boolean
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export type Role = {
  id: string
  name: string
  key: string
  description: string
  isActive: boolean
  /**
   * Whether new users are automatically assigned this role on sign-up,
   * invitation acceptance or any other user creation path.
   */
  assignOnJoin: boolean
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
}

export type RolePermission = {
  id: string
  roleId: string
  permissionId: string
  createdAt: Date
}

export type UserRole = {
  id: string
  userId: string
  roleId: string
  createdAt: Date
}

export type PermissionCreateInput = Omit<
  Permission,
  "id" | "isSystem" | "createdAt" | "updatedAt"
> & {
  isSystem?: boolean
}
export type RoleCreateInput = Omit<
  Role,
  "id" | "isSystem" | "createdAt" | "updatedAt"
> & {
  isSystem?: boolean
}
export type RolePermissionCreateInput = Omit<RolePermission, "id" | "createdAt">
export type UserRoleCreateInput = Omit<UserRole, "id" | "createdAt">

export type User = {
  id: string
  email: string
  name?: string
  role?: string
  banned?: boolean | null
  createdAt: Date
  updatedAt: Date
}

export type RBACEndpoint =
  | "assignPermissionToRole"
  | "removePermissionFromRole"
  | "assignRoleToUser"
  | "removeRoleFromUser"
  | "bulkAssignRoleToUsers"
  | "bulkRemoveRoleFromUsers"
  | "bulkAssignRolesToUser"
  | "bulkRemoveRolesFromUser"
  | "bulkAssignPermissionsToRole"
  | "bulkRemovePermissionsFromRole"
  | "bulkAssignPermissionToRoles"
  | "bulkRemoveRolesFromPermission"
  | "listPermissions"
  | "getPermission"
  | "createPermission"
  | "clonePermission"
  | "updatePermission"
  | "deletePermission"
  | "getPermissionsOptions"
  | "getPermissionRoles"
  | "checkPermission"
  | "hasPermission"
  | "listRoles"
  | "getRole"
  | "createRole"
  | "cloneRole"
  | "updateRole"
  | "deleteRole"
  | "getRolesOptions"
  | "getRolePermissions"
  | "getUserRoles"
  | "getUserPermissions"
  | "setUserRoles"
  | "getRoleUsers"
  | "getUsersOptions"
  | "updateUser"

export interface RBACPluginOptions {
  /**
   * Minimum length for role keys
   * @default 3
   */
  minRoleKeyLength?: number
  /**
   * Maximum length for role keys
   * @default 50
   */
  maxRoleKeyLength?: number
  /**
   * Regex pattern for valid role keys
   * Default pattern enforces simple alphanumeric format (e.g., "admin", "moderator", "user_manager")
   * @default /^[a-z0-9_]+$/i
   * @example /^[a-z]+$/ for only lowercase letters
   */
  roleKeyPattern?: RegExp
  /**
   * Custom error message for invalid role key format
   */
  roleKeyErrorMessage?: string
  /**
   * Minimum length for permission keys
   * @default 3
   */
  minPermissionKeyLength?: number
  /**
   * Maximum length for permission keys
   * @default 50
   */
  maxPermissionKeyLength?: number
  /**
   * Regex pattern for valid permission keys
   * Default pattern enforces "feature:action" format (e.g., "user:read", "post:write")
   * @default /^[a-z0-9_-]+:[a-z0-9_-]+$/i
   * @example /^[a-z]+\.[a-z]+$/ for dot notation like "user.read"
   */
  permissionKeyPattern?: RegExp
  /**
   * Custom error message for invalid permission key format
   */
  permissionKeyErrorMessage?: string
  /**
   * Default limit for list endpoints
   * @default 10
   */
  defaultLimit?: number
  /**
   * Maximum limit allowed for list endpoints
   * @default 100
   */
  maxLimit?: number
  /**
   * Default offset for pagination
   * @default 0
   */
  defaultOffset?: number
  /**
   * Maximum offset allowed for list endpoints
   * Negative values are clamped to `defaultOffset` and values above this cap are clamped to it.
   * @default 10000
   */
  maxOffset?: number
  /**
   * Maximum number of ids accepted in a single request for endpoints that take
   * arrays of ids (bulk assignments, `createRole`, `updateRole`, `createPermission`,
   * `updatePermission`, `setUserRoles`, `updateUser`). Duplicates are removed before
   * enforcing this cap.
   * @default 500
   */
  maxBatchAssignmentSize?: number
  /**
   * Maximum number of concurrent inserts issued by the bulk assignment endpoints
   * while writing the join rows. Ignored when the adapter runs the batch inside a
   * transaction, since transactions serialize statements on a single connection.
   * @default 10
   */
  maxBatchWriteConcurrency?: number
  /**
   * Permissions that will be seeded (created) when initializing the plugin
   * @example
   * ```ts
   * seedPermissions: [
   *   { key: 'user.read', name: 'Read Users', description: 'Can view users', isActive: true },
   *   { key: 'user.write', name: 'Write Users', description: 'Can create/edit users', isActive: true }
   * ]
   * ```
   */
  seedPermissions?: Array<{
    key: string
    name: string
    description: string
    /**
     * Whether the permission is active
     * @default true
     */
    isActive?: boolean
  }>
  /**
   * Roles that will be seeded (created) when initializing the plugin
   * You can associate permissions using the keys defined in seedPermissions
   * @example
   * ```ts
   * seedRoles: [
   *   {
   *     key: 'admin',
   *     name: 'Administrator',
   *     description: 'Full access',
   *     permissions: ['user.read', 'user.write'],
   *     isActive: true
   *   }
   * ]
   * ```
   */
  seedRoles?: Array<{
    key: string
    name: string
    description: string
    /**
     * Whether the role is active
     * @default true
     */
    isActive?: boolean
    /**
     * Whether new users are automatically assigned this role when they are
     * created (sign-up, invitation acceptance, admin create, social login).
     * @default false
     */
    assignOnJoin?: boolean
    permissions?: string[]
  }>
  /**
   * Array of endpoint names to disable
   * @example ["deletePermission", "deleteRole", "removeRoleFromUser"]
   * @default []
   */
  disabledEndpoints?: RBACEndpoint[]
  /**
   * System protection mode for roles and permissions with `isSystem: true`.
   * - `"strict"`: No updates (name, description, key, isActive) or deletions allowed.
   * - `"allow_metadata_edit"`: Updates to `name` and `description` are allowed, but `key`, `isActive` and deletion remain prohibited.
   * @default "strict"
   */
  systemProtectionMode?: SystemProtectionMode
}
