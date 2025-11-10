export type Permission = {
  id: string
  name: string
  key: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type Role = {
  id: string
  name: string
  key: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
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

export type User = {
  id: string
  email: string
  name?: string
  role?: string
  createdAt: Date
  updatedAt: Date
}
export interface RBACPluginOptions {
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
    description?: string
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
    description?: string
    /**
     * Whether the role is active
     * @default true
     */
    isActive?: boolean
    permissions?: string[]
  }>
}
