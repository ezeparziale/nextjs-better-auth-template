import type { Where } from "better-auth"
import { APIError, createAuthEndpoint } from "better-auth/api"
import * as z from "zod"
import { createPaginationConfig, ensureUserIsAdmin, rbacMiddleware } from "../call"
import { RBAC_ERROR_CODES } from "../error-codes"
import type {
  Permission,
  RBACPluginOptions,
  Role,
  RolePermission,
  User,
  UserRole,
} from "../types"
import { getPaginationParams } from "../utils"

/**
 * ### Endpoint
 *
 * GET `/rbac/get-user-roles`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.getUserRoles`
 *
 * **client:**
 * `authClient.rbac.getUserRoles`
 */
export const getUserRoles = <O extends RBACPluginOptions>(options: O) => {
  const paginationConfig = createPaginationConfig(options)

  return createAuthEndpoint(
    "/rbac/get-user-roles",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z.object({
        userId: z.string().meta({
          description: "The ID of the user.",
        }),
        searchValue: z.string().optional().meta({
          description: "The value to search in roles.",
        }),
        searchField: z.enum(["name", "key"]).optional().meta({
          description:
            "The field to search in, defaults to name. Can be `name` or `key`.",
        }),
        searchOperator: z
          .enum(["contains", "starts_with", "ends_with"])
          .meta({
            description:
              'The operator to use for the search. Can be `contains`, `starts_with` or `ends_with`. Eg: "contains"',
          })
          .optional(),
        limit: z
          .string()
          .meta({ description: "The number of roles to return." })
          .or(z.number())
          .optional()
          .default(paginationConfig.defaultLimit),
        offset: z
          .string()
          .meta({
            description: "The offset to start from.",
          })
          .or(z.number())
          .optional()
          .default(paginationConfig.defaultOffset),
        sortBy: z
          .string()
          .meta({
            description: "The field to sort by.",
          })
          .optional(),
        sortDirection: z
          .enum(["asc", "desc"])
          .meta({
            description: "The direction to sort by.",
          })
          .optional(),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.getUserRoles",
          summary: "Get all roles for a user",
          description:
            "Get all roles for a user with pagination, search and sorting support",
          responses: {
            200: {
              description: "User roles",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      user: {
                        $ref: "#/components/schemas/User",
                      },
                      roles: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/Role",
                        },
                      },
                      total: {
                        type: "number",
                      },
                      limit: {
                        type: "number",
                      },
                      offset: {
                        type: "number",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["USER_NOT_FOUND"],
                      },
                      error: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.USER_NOT_FOUND],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (ctx) => {
      if (options.disabledEndpoints?.includes("getUserRoles")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      const { userId } = ctx.query

      // Look up the user by ID
      const user = await ctx.context.adapter.findOne<User>({
        model: "user",
        where: [{ field: "id", value: userId }],
      })

      // If the user does not exist, return a 404 error
      if (!user) {
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.USER_NOT_FOUND,
        })
      }

      // Get all user-role mappings for this user
      const userRoles = await ctx.context.adapter.findMany<UserRole>({
        model: "userRole",
        where: [{ field: "userId", value: user.id }],
      })

      // Extract role IDs
      const roleIds = userRoles.map((ur) => ur.roleId)

      // If there are no roles, return empty result
      if (roleIds.length === 0) {
        return ctx.json({
          user,
          roles: [],
          total: 0,
          limit: Number(ctx.query?.limit),
          offset: Number(ctx.query?.offset),
        })
      }

      // Build where clause for roles
      const where: Where[] = [
        {
          field: "id",
          operator: "in",
          value: roleIds,
        },
      ]

      // Add search filter if provided
      if (ctx.query?.searchValue) {
        where.push({
          field: ctx.query.searchField || "name",
          operator: ctx.query.searchOperator || "contains",
          value: ctx.query.searchValue,
        })
      }

      const { limit, offset } = getPaginationParams(
        ctx.query?.limit,
        ctx.query?.offset,
        paginationConfig,
      )

      try {
        // Get paginated, sorted and filtered roles
        const roles = await ctx.context.adapter.findMany<Role>({
          model: "role",
          limit,
          offset,
          sortBy: ctx.query?.sortBy
            ? {
                field: ctx.query.sortBy,
                direction: ctx.query.sortDirection || "asc",
              }
            : undefined,
          where: where.length ? where : undefined,
        })

        // Get total count of filtered roles
        const total = await ctx.context.adapter.count({
          model: "role",
          where: where.length ? where : undefined,
        })

        return ctx.json({
          user,
          roles,
          total,
          limit: Number(ctx.query?.limit),
          offset: Number(ctx.query?.offset),
        })
      } catch {
        return ctx.json({
          user,
          roles: [],
          total: 0,
          limit: Number(ctx.query?.limit),
          offset: Number(ctx.query?.offset),
        })
      }
    },
  )
}

/**
 * ### Endpoint
 *
 * GET `/rbac/get-user-permissions`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.getUserPermissions`
 *
 * **client:**
 * `authClient.rbac.getUserPermissions`
 */
export const getUserPermissions = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/get-user-permissions",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z.object({
        userId: z.string().meta({
          description: "The id of the user.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.getUserPermissions",
          summary: "Get all permissions for a user (from their roles)",
          description: "Get all permissions for a user through their assigned roles",
          responses: {
            200: {
              description: "User permissions",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      permissions: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/Permission",
                        },
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "User not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["USER_NOT_FOUND"],
                      },
                      error: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.USER_NOT_FOUND],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (ctx) => {
      if (options.disabledEndpoints?.includes("getUserPermissions")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Check if user exists
      const user = await ctx.context.adapter.findOne<User>({
        model: "user",
        where: [
          {
            field: "id",
            value: ctx.query.userId,
          },
        ],
      })

      if (!user) {
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.USER_NOT_FOUND,
        })
      }

      // Get user roles
      const userRoles = await ctx.context.adapter.findMany<UserRole>({
        model: "userRole",
        where: [
          {
            field: "userId",
            value: ctx.query.userId,
          },
        ],
      })

      // Get all permissions from all roles
      const allPermissions: Permission[] = []
      const permissionIds = new Set<string>()

      for (const userRole of userRoles) {
        const rolePermissions = await ctx.context.adapter.findMany<RolePermission>({
          model: "rolePermission",
          where: [
            {
              field: "roleId",
              value: userRole.roleId,
            },
          ],
        })

        for (const rp of rolePermissions) {
          if (!permissionIds.has(rp.permissionId)) {
            const permission = await ctx.context.adapter.findOne<Permission>({
              model: "permission",
              where: [
                {
                  field: "id",
                  value: rp.permissionId,
                },
              ],
            })

            if (permission) {
              allPermissions.push(permission)
              permissionIds.add(rp.permissionId)
            }
          }
        }
      }

      return ctx.json({
        permissions: allPermissions,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/set-user-roles`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.setUserRoles`
 *
 * **client:**
 * `authClient.rbac.setUserRoles`
 */
export const setUserRoles = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/set-user-roles",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        userId: z.string().meta({
          description: "The id of the user.",
        }),
        roleIds: z.array(z.string()).meta({
          description: "Array of role IDs to set for the user.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.setUserRoles",
          summary: "Set roles for a user",
          description:
            "Replace user's current roles with the provided array of role IDs. Adds new roles, removes old ones, and keeps existing ones.",
          responses: {
            200: {
              description: "Roles set successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                      },
                      message: {
                        type: "string",
                      },
                      added: {
                        type: "number",
                        description: "Number of roles added",
                      },
                      removed: {
                        type: "number",
                        description: "Number of roles removed",
                      },
                      kept: {
                        type: "number",
                        description: "Number of roles kept unchanged",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "User or role not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["USER_NOT_FOUND", "ROLE_NOT_FOUND"],
                      },
                      error: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.USER_NOT_FOUND,
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND,
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (ctx) => {
      if (options.disabledEndpoints?.includes("setUserRoles")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Check if user exists
      const user = await ctx.context.adapter.findOne<User>({
        model: "user",
        where: [
          {
            field: "id",
            value: ctx.body.userId,
          },
        ],
      })

      if (!user) {
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.USER_NOT_FOUND,
        })
      }

      // Validate all roles exist
      if (ctx.body.roleIds.length > 0) {
        for (const roleId of ctx.body.roleIds) {
          const role = await ctx.context.adapter.findOne<Role>({
            model: "role",
            where: [
              {
                field: "id",
                value: roleId,
              },
            ],
          })

          if (!role) {
            throw new APIError("NOT_FOUND", {
              message: `${RBAC_ERROR_CODES.ROLE_NOT_FOUND}: ${roleId}`,
            })
          }
        }
      }

      // Get current user roles
      const currentUserRoles = await ctx.context.adapter.findMany<UserRole>({
        model: "userRole",
        where: [
          {
            field: "userId",
            value: ctx.body.userId,
          },
        ],
      })

      const currentRoleIds = new Set(currentUserRoles.map((ur) => ur.roleId))
      const newRoleIds = new Set(ctx.body.roleIds)

      // Find roles to delete (exist in current but not in new)
      const toDelete = currentUserRoles.filter((ur) => !newRoleIds.has(ur.roleId))

      // Find roles to add (exist in new but not in current)
      const toAdd = ctx.body.roleIds.filter((roleId) => !currentRoleIds.has(roleId))

      // Find roles to keep (exist in both)
      const kept = ctx.body.roleIds.filter((roleId) => currentRoleIds.has(roleId))

      // Delete removed roles in parallel
      if (toDelete.length > 0) {
        await Promise.all(
          toDelete.map((ur) =>
            ctx.context.adapter.delete<UserRole>({
              model: "userRole",
              where: [
                {
                  field: "id",
                  value: ur.id,
                },
              ],
            }),
          ),
        )
      }

      // Create new roles in parallel
      if (toAdd.length > 0) {
        await Promise.all(
          toAdd.map((roleId) =>
            ctx.context.adapter.create<UserRole>({
              model: "userRole",
              data: {
                userId: ctx.body.userId,
                roleId: roleId,
                createdAt: new Date(),
              },
            }),
          ),
        )
      }

      return ctx.json({
        success: true,
        message: "User roles updated successfully",
        added: toAdd.length,
        removed: toDelete.length,
        kept: kept.length,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * GET `/rbac/get-users-options`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.getUsersOptions`
 *
 * **client:**
 * `authClient.rbac.getUsersOptions`
 */
export const getUsersOptions = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/get-users-options",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z.object({
        onlyActive: z
          .string()
          .transform((val) => val === "true")
          .or(z.boolean())
          .optional()
          .default(true)
          .meta({
            description: "Filter to return only active users. Defaults to true.",
          }),
        search: z.string().optional().meta({
          description: "Search term to filter users by email.",
        }),
        limit: z
          .string()
          .transform((val) => parseInt(val, 10))
          .or(z.number())
          .optional()
          .meta({
            description: "Maximum number of results to return.",
          }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.getUsersOptions",
          summary: "Get users as select options",
          description:
            "Get users formatted as value/label pairs for select components. Supports search and limit parameters.",
          responses: {
            200: {
              description: "Successfully retrieved users options",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      options: {
                        type: "array",
                        items: {
                          type: "object",
                          required: ["value", "label"],
                          properties: {
                            value: {
                              type: "string",
                              description: "User ID",
                            },
                            label: {
                              type: "string",
                              description: "User email address",
                            },
                          },
                        },
                      },
                    },
                    required: ["options"],
                  },
                  examples: {
                    withResults: {
                      summary: "Successful response with users",
                      value: {
                        options: [
                          {
                            value: "user_123abc",
                            label: "john.doe@example.com",
                          },
                          {
                            value: "user_456def",
                            label: "jane.smith@example.com",
                          },
                          {
                            value: "user_789ghi",
                            label: "admin@example.com",
                          },
                        ],
                      },
                    },
                    emptyResults: {
                      summary: "No users found",
                      value: {
                        options: [],
                      },
                    },
                    searchFiltered: {
                      summary: "Filtered by search term",
                      value: {
                        options: [
                          {
                            value: "user_123abc",
                            label: "john.doe@example.com",
                          },
                          {
                            value: "user_456def",
                            label: "johnny.smith@example.com",
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (ctx) => {
      if (options.disabledEndpoints?.includes("getUsersOptions")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      const where: Where[] = []

      if (ctx.query?.onlyActive) {
        where.push({
          field: "emailVerified",
          value: true,
        })
      }

      try {
        const users = await ctx.context.adapter.findMany<User>({
          model: "user",
          where: where.length ? where : undefined,
          sortBy: {
            field: "email",
            direction: "asc",
          },
        })

        // Filter by search term if provided
        let filteredUsers = users
        if (ctx.query?.search) {
          const searchLower = ctx.query.search.toLowerCase()
          filteredUsers = users.filter((user) =>
            user.email.toLowerCase().includes(searchLower),
          )
        }

        // Apply limit if provided
        if (ctx.query?.limit && ctx.query.limit > 0) {
          filteredUsers = filteredUsers.slice(0, ctx.query.limit)
        }

        const options = filteredUsers.map((user) => ({
          value: user.id,
          label: user.email,
        }))

        return ctx.json({
          options,
        })
      } catch {
        return ctx.json({
          options: [],
        })
      }
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/update-user`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.updateUser`
 *
 * **client:**
 * `authClient.rbac.updateUser`
 */
export const rbacUpdateUser = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/update-user",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        userId: z.string().meta({
          description: "The id of the user to update.",
        }),
        roleIds: z.array(z.string()).optional().meta({
          description: "Optional array of role IDs to replace current user roles.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.updateUser",
          summary: "Update user roles",
          description:
            "Update user's roles. Replace current roles with the provided array of role IDs.",
          responses: {
            200: {
              description: "User updated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      user: {
                        $ref: "#/components/schemas/User",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "User or role not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["USER_NOT_FOUND", "ROLE_NOT_FOUND"],
                      },
                      error: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.USER_NOT_FOUND,
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND,
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (ctx) => {
      if (options.disabledEndpoints?.includes("updateUser")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Check if user exists
      const user = await ctx.context.adapter.findOne<User>({
        model: "user",
        where: [
          {
            field: "id",
            value: ctx.body.userId,
          },
        ],
      })

      if (!user) {
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.USER_NOT_FOUND,
        })
      }

      // Update roles if provided
      if (ctx.body.roleIds !== undefined) {
        // Validate all roles exist
        if (ctx.body.roleIds.length > 0) {
          for (const roleId of ctx.body.roleIds) {
            const role = await ctx.context.adapter.findOne<Role>({
              model: "role",
              where: [
                {
                  field: "id",
                  value: roleId,
                },
              ],
            })

            if (!role) {
              throw new APIError("NOT_FOUND", {
                message: `${RBAC_ERROR_CODES.ROLE_NOT_FOUND}: ${roleId}`,
              })
            }
          }
        }

        // Get current user roles
        const currentUserRoles = await ctx.context.adapter.findMany<UserRole>({
          model: "userRole",
          where: [
            {
              field: "userId",
              value: ctx.body.userId,
            },
          ],
        })

        const currentRoleIds = new Set(currentUserRoles.map((ur) => ur.roleId))
        const newRoleIds = new Set(ctx.body.roleIds)

        // Find roles to delete (exist in current but not in new)
        const toDelete = currentUserRoles.filter((ur) => !newRoleIds.has(ur.roleId))

        // Find roles to add (exist in new but not in current)
        const toAdd = ctx.body.roleIds.filter((roleId) => !currentRoleIds.has(roleId))

        // Delete removed roles in parallel
        if (toDelete.length > 0) {
          await Promise.all(
            toDelete.map((ur) =>
              ctx.context.adapter.delete<UserRole>({
                model: "userRole",
                where: [
                  {
                    field: "id",
                    value: ur.id,
                  },
                ],
              }),
            ),
          )
        }

        // Create new roles in parallel
        if (toAdd.length > 0) {
          await Promise.all(
            toAdd.map((roleId) =>
              ctx.context.adapter.create<UserRole>({
                model: "userRole",
                data: {
                  userId: ctx.body.userId,
                  roleId: roleId,
                  createdAt: new Date(),
                },
              }),
            ),
          )
        }
      }

      return ctx.json({
        user,
      })
    },
  )
}
