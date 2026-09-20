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
  UserRoleCreateInput,
} from "../types"
import { findMissingIds, getPaginationParams, normalizeIdBatch } from "../utils"
import { sortByRole, sortByUser, sortDirection } from "./sort-schemas"

/**
 * ### Endpoint
 *
 * GET `/rbac/get-user-roles`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacGetUserRoles`
 *
 * **client:**
 * `authClient.rbac.getUserRoles`
 */
export const rbacGetUserRoles = <O extends RBACPluginOptions>(options: O) => {
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
        sortBy: sortByRole,
        sortDirection,
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
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.USER_NOT_FOUND.message],
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.USER_NOT_FOUND)
      }

      // Get all user-role mappings for this user
      const userRoles = await ctx.context.adapter.findMany<UserRole>({
        model: "userRole",
        where: [{ field: "userId", value: user.id }],
      })

      // Extract role IDs
      const roleIds = userRoles.map((ur) => ur.roleId)

      const { limit, offset } = getPaginationParams(
        ctx.query?.limit,
        ctx.query?.offset,
        paginationConfig,
      )

      // If there are no roles, return empty result
      if (roleIds.length === 0) {
        return ctx.json({
          user,
          roles: [],
          total: 0,
          limit,
          offset,
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
          limit,
          offset,
        })
      } catch {
        return ctx.json({
          user,
          roles: [],
          total: 0,
          limit,
          offset,
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
 * `auth.api.rbacGetUserPermissions`
 *
 * **client:**
 * `authClient.rbac.getUserPermissions`
 */
export const rbacGetUserPermissions = <O extends RBACPluginOptions>(options: O) => {
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
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.USER_NOT_FOUND.message],
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.USER_NOT_FOUND)
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

      // Get all role-permission assignments in a single batched query
      const roleIds = userRoles.map((userRole) => userRole.roleId)

      let rolePermissions: RolePermission[] = []
      if (roleIds.length > 0) {
        rolePermissions = await ctx.context.adapter.findMany<RolePermission>({
          model: "rolePermission",
          where: [
            {
              field: "roleId",
              operator: "in",
              value: roleIds,
            },
          ],
        })
      }

      // Get all permissions from all roles
      const allPermissions: Permission[] = []
      const permissionIds = new Set(rolePermissions.map((rp) => rp.permissionId))

      // Fetch all referenced permissions in a single batched query
      let permissionsById = new Map<string, Permission>()
      if (permissionIds.size > 0) {
        const permissions = await ctx.context.adapter.findMany<Permission>({
          model: "permission",
          where: [
            {
              field: "id",
              operator: "in",
              value: [...permissionIds],
            },
          ],
        })

        permissionsById = new Map(
          permissions.map((permission) => [permission.id, permission]),
        )
      }

      for (const permissionId of permissionIds) {
        const permission = permissionsById.get(permissionId)
        if (permission) {
          allPermissions.push(permission)
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
 * `auth.api.rbacSetUserRoles`
 *
 * **client:**
 * `authClient.rbac.setUserRoles`
 */
export const rbacSetUserRoles = <O extends RBACPluginOptions>(options: O) => {
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
            400: {
              description: "Batch size cap was exceeded",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["BATCH_TOO_LARGE"],
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.BATCH_TOO_LARGE.message],
                      },
                      details: {
                        type: "object",
                        description: "Present when code is BATCH_TOO_LARGE.",
                        properties: {
                          ids: {
                            type: "string",
                            description: "The id array field that exceeded the cap.",
                          },
                          provided: {
                            type: "number",
                            description:
                              "Number of unique ids provided in the request.",
                          },
                          maxBatchAssignmentSize: {
                            type: "number",
                            description: "The configured cap that was exceeded.",
                          },
                        },
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
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.USER_NOT_FOUND.message,
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                        ],
                      },
                      details: {
                        type: "object",
                        description: "Present when code is ROLE_NOT_FOUND.",
                        properties: {
                          missingRoleIds: {
                            type: "array",
                            description: "The role ids that were not found.",
                            items: { type: "string" },
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.USER_NOT_FOUND)
      }

      // Dedupe role ids and enforce the batch size cap
      const roleIds = normalizeIdBatch(ctx.body.roleIds, options, "roleIds")

      // Validate all roles exist (single batched query)
      if (roleIds.length > 0) {
        const missingRoleIds = await findMissingIds(
          ctx.context.adapter,
          "role",
          roleIds,
        )

        if (missingRoleIds.length > 0) {
          throw new APIError("NOT_FOUND", {
            code: RBAC_ERROR_CODES.ROLE_NOT_FOUND.code,
            message: RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
            details: { missingRoleIds },
          })
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
      const newRoleIds = new Set(roleIds)

      // Find roles to delete (exist in current but not in new)
      const toDelete = currentUserRoles.filter((ur) => !newRoleIds.has(ur.roleId))

      // Find roles to add (exist in new but not in current)
      const toAdd = roleIds.filter((roleId) => !currentRoleIds.has(roleId))

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
            ctx.context.adapter.create<UserRoleCreateInput, UserRole>({
              model: "userRole",
              data: {
                userId: ctx.body.userId,
                roleId: roleId,
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
 * `auth.api.rbacGetUsersOptions`
 *
 * **client:**
 * `authClient.rbac.getUsersOptions`
 */
export const rbacGetUsersOptions = <O extends RBACPluginOptions>(options: O) => {
  const paginationConfig = createPaginationConfig(options)

  return createAuthEndpoint(
    "/rbac/get-users-options",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z.object({
        onlyActive: z.stringbool().or(z.boolean()).optional().default(false).meta({
          description:
            "Filter to return only active users (not banned). Defaults to false.",
        }),
        search: z.string().optional().meta({
          description: "Search term to filter users by email or name.",
        }),
        limit: z
          .string()
          .transform((val) => parseInt(val, 10))
          .or(z.number())
          .optional()
          .meta({
            description: "Maximum number of results to return.",
          }),
        sortBy: sortByUser,
        sortDirection,
      }),
      metadata: {
        openapi: {
          operationId: "rbac.getUsersOptions",
          summary: "Get users as select options",
          description:
            "Get users formatted as value/label pairs for select components. Supports search, limit and sorting parameters. Only active (not banned) users are returned when onlyActive is true.",
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
                            name: {
                              type: "string",
                              description: "User display name",
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
                            name: "John Doe",
                          },
                          {
                            value: "user_456def",
                            label: "jane.smith@example.com",
                            name: "Jane Smith",
                          },
                          {
                            value: "user_789ghi",
                            label: "admin@example.com",
                            name: null,
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
                            name: "John Doe",
                          },
                          {
                            value: "user_456def",
                            label: "johnny.smith@example.com",
                            name: "Johnny Smith",
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
          field: "banned",
          value: false,
        })
      }

      const search = ctx.query?.search?.trim()
      if (search) {
        where.push(
          {
            field: "email",
            operator: "contains",
            value: search,
            connector: "OR",
          },
          {
            field: "name",
            operator: "contains",
            value: search,
            connector: "OR",
          },
        )
      }

      // Move the search term and limit down to the database
      const { limit } = getPaginationParams(
        ctx.query?.limit,
        undefined,
        paginationConfig,
      )

      try {
        const filteredUsers = await ctx.context.adapter.findMany<User>({
          model: "user",
          where: where.length ? where : undefined,
          limit,
          select: ["id", "email", "name"],
          sortBy: {
            field: ctx.query?.sortBy || "email",
            direction: ctx.query?.sortDirection || "asc",
          },
        })

        const options = filteredUsers.map((user) => ({
          value: user.id,
          label: user.email,
          name: user.name || null,
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
 * `auth.api.rbacUpdateUser`
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
            400: {
              description: "Batch size cap was exceeded",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["BATCH_TOO_LARGE"],
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.BATCH_TOO_LARGE.message],
                      },
                      details: {
                        type: "object",
                        description: "Present when code is BATCH_TOO_LARGE.",
                        properties: {
                          ids: {
                            type: "string",
                            description: "The id array field that exceeded the cap.",
                          },
                          provided: {
                            type: "number",
                            description:
                              "Number of unique ids provided in the request.",
                          },
                          maxBatchAssignmentSize: {
                            type: "number",
                            description: "The configured cap that was exceeded.",
                          },
                        },
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
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.USER_NOT_FOUND.message,
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                        ],
                      },
                      details: {
                        type: "object",
                        description: "Present when code is ROLE_NOT_FOUND.",
                        properties: {
                          missingRoleIds: {
                            type: "array",
                            description: "The role ids that were not found.",
                            items: { type: "string" },
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.USER_NOT_FOUND)
      }

      // Update roles if provided
      if (ctx.body.roleIds !== undefined) {
        // Dedupe role ids and enforce the batch size cap
        const roleIds = normalizeIdBatch(ctx.body.roleIds, options, "roleIds")

        // Validate all roles exist (single batched query)
        if (roleIds.length > 0) {
          const missingRoleIds = await findMissingIds(
            ctx.context.adapter,
            "role",
            roleIds,
          )

          if (missingRoleIds.length > 0) {
            throw new APIError("NOT_FOUND", {
              code: RBAC_ERROR_CODES.ROLE_NOT_FOUND.code,
              message: RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
              details: { missingRoleIds },
            })
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
        const newRoleIds = new Set(roleIds)

        // Find roles to delete (exist in current but not in new)
        const toDelete = currentUserRoles.filter((ur) => !newRoleIds.has(ur.roleId))

        // Find roles to add (exist in new but not in current)
        const toAdd = roleIds.filter((roleId) => !currentRoleIds.has(roleId))

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
              ctx.context.adapter.create<UserRoleCreateInput, UserRole>({
                model: "userRole",
                data: {
                  userId: ctx.body.userId,
                  roleId: roleId,
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
