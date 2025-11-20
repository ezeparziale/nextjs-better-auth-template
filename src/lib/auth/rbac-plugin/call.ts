import type { Session } from "better-auth"
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api"
import { UserWithRole } from "better-auth/plugins/admin"
import type { RBACPluginOptions } from "./types"

const DEFAULT_PERMISSION_KEY_PATTERN = /^[a-z0-9_]+:[a-z0-9_]+$/i
const DEFAULT_ROLE_KEY_PATTERN = /^[a-z0-9_]+$/i

/**
 * Ensures a valid session, if not will throw.
 * Will also provide additional types on the user to include role types.
 */
export const rbacMiddleware = createAuthMiddleware(async (ctx) => {
  const session = await getSessionFromCtx(ctx)
  if (!session) {
    throw new APIError("UNAUTHORIZED")
  }
  return {
    session,
  } as {
    session: {
      user: UserWithRole
      session: Session
    }
  }
})

/**
 * Ensures the user has the "admin" role, otherwise throws a "FORBIDDEN" error.
 */
export const ensureUserIsAdmin = (session: { user: { role?: string | null } }) => {
  const roles = session.user.role?.split(",").map((role) => role.trim()) || []
  if (!roles.includes("admin")) {
    throw new APIError("FORBIDDEN")
  }
}

/**
 * Creates validation options for permission and role keys
 */
export const createValidationOptions = (opts: RBACPluginOptions) => ({
  permission: {
    minLength: opts.minPermissionKeyLength ?? 3,
    maxLength: opts.maxPermissionKeyLength ?? 50,
    pattern: opts.permissionKeyPattern ?? DEFAULT_PERMISSION_KEY_PATTERN,
    errorMessage: opts.permissionKeyErrorMessage,
  },
  role: {
    minLength: opts.minRoleKeyLength ?? 3,
    maxLength: opts.maxRoleKeyLength ?? 50,
    pattern: opts.roleKeyPattern ?? DEFAULT_ROLE_KEY_PATTERN,
    errorMessage: opts.roleKeyErrorMessage,
  },
})

/**
 * Creates pagination configuration
 */
export const createPaginationConfig = (opts: RBACPluginOptions) => ({
  defaultLimit: opts.defaultLimit ?? 10,
  maxLimit: opts.maxLimit ?? 100,
  defaultOffset: opts.defaultOffset ?? 0,
})
