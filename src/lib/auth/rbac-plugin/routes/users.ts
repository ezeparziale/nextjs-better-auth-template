import type { Where } from "better-auth"
import { APIError, createAuthEndpoint } from "better-auth/api"
import * as z from "zod"
import { buildFilterWhere, zBooleanFilter } from "../../shared/filters"
import type { OpenApiParameter } from "../../shared/openapi-types"
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
import { sortByPermission, sortByRole, sortByUser, sortDirection } from "./sort-schemas"

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
        search: z.string().optional().meta({
          description:
            "The value to search in roles. Matches role name or key, case-insensitive.",
        }),
        isActive: zBooleanFilter,
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
          parameters: [
            {
              name: "userId",
              in: "query",
              required: true,
              description: "The ID of the user.",
              schema: {
                type: "string",
                example: "user_9mQGfY2Z",
              },
            },
            {
              name: "search",
              in: "query",
              description:
                "The value to search in roles. Matches role name or key, case-insensitive.",
              schema: {
                type: "string",
                example: "admin",
              },
            },
            {
              name: "isActive",
              in: "query",
              description:
                "Filter the returned roles by their active status. Accepts a boolean (true/1/yes/on, false/0/no/off) or a comma-separated/repeated list.",
              schema: {
                type: "string",
              },
              examples: {
                active: { value: "true" },
                inactive: { value: "false" },
              },
            },
            {
              name: "limit",
              in: "query",
              description: "The number of roles to return.",
              schema: {
                type: "integer",
                example: "10",
              },
            },
            {
              name: "offset",
              in: "query",
              description: "The offset to start from.",
              schema: {
                type: "integer",
                example: "0",
              },
            },
            {
              name: "sortBy",
              in: "query",
              description:
                "The role field to sort by. Allowed: id, name, key, isActive, createdAt, updatedAt, createdBy, updatedBy.",
              schema: {
                type: "string",
                enum: [
                  "id",
                  "name",
                  "key",
                  "isActive",
                  "createdAt",
                  "updatedAt",
                  "createdBy",
                  "updatedBy",
                ],
              },
              examples: {
                id: { value: "id" },
                name: { value: "name" },
                key: { value: "key" },
                isActive: { value: "isActive" },
                createdAt: { value: "createdAt" },
                updatedAt: { value: "updatedAt" },
                createdBy: { value: "createdBy" },
                updatedBy: { value: "updatedBy" },
              },
            },
            {
              name: "sortDirection",
              in: "query",
              description: "The direction to sort by.",
              schema: {
                type: "string",
                enum: ["asc", "desc"],
              },
              examples: {
                asc: { value: "asc" },
                desc: { value: "desc" },
              },
            },
          ] satisfies OpenApiParameter[],
          responses: {
            200: {
              description: "User roles",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        description: "The list payload.",
                        properties: {
                          user: {
                            description: "Minimal user info (id, name, email).",
                            type: "object",
                            properties: {
                              id: {
                                type: "string",
                                description: "The user id.",
                                example: "user_9mQGfY2Z",
                              },
                              name: {
                                type: "string",
                                nullable: true,
                                description: "The user name.",
                                example: "Jane Doe",
                              },
                              email: {
                                type: "string",
                                description: "The user email.",
                                example: "jane@example.com",
                              },
                            },
                          },
                          roles: {
                            description: "The roles assigned to the user.",
                            type: "array",
                            items: {
                              $ref: "#/components/schemas/Role",
                            },
                          },
                        },
                      },
                      total: {
                        type: "number",
                        description: "Total number of matching records.",
                        example: 42,
                      },
                      limit: {
                        type: "number",
                        description: "Maximum number of records returned.",
                        example: 10,
                      },
                      offset: {
                        type: "number",
                        description: "Offset used for pagination.",
                        example: 0,
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid query parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["code", "message"],
                    properties: {
                      code: {
                        type: "string",
                        enum: ["VALIDATION_ERROR"],
                        description: "The error code.",
                        example: "VALIDATION_ERROR",
                      },
                      message: {
                        type: "string",
                        description: "Human-readable validation error message.",
                        example:
                          "[query.sortDirection] Invalid input: expected 'asc' | 'desc', received 'sideways'",
                      },
                    },
                  },
                  examples: {
                    validationError: {
                      summary: "Invalid query parameters",
                      value: {
                        code: "VALIDATION_ERROR",
                        message:
                          "[query.sortDirection] Invalid input: expected 'asc' | 'desc', received 'sideways'",
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
                    required: ["code", "message"],
                    properties: {
                      code: {
                        type: "string",
                        enum: ["USER_NOT_FOUND"],
                        description: "The error code.",
                        example: "USER_NOT_FOUND",
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.USER_NOT_FOUND.message],
                        description: "Human-readable error message.",
                        example: "User not found.",
                      },
                    },
                  },
                  examples: {
                    userNotFound: {
                      summary: "User not found.",
                      value: {
                        code: "USER_NOT_FOUND",
                        message: "User not found.",
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
        select: ["id", "name", "email"],
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
          data: { user, roles: [] },
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

      // Add search filter over name OR key if provided
      const search = ctx.query?.search?.trim()
      if (search) {
        where.push(
          {
            field: "name",
            operator: "contains",
            value: search,
            connector: "OR",
          },
          {
            field: "key",
            operator: "contains",
            value: search,
            connector: "OR",
          },
        )
      }

      // Add isActive filter if provided
      where.push(
        ...buildFilterWhere(ctx.query as Record<string, unknown>, {
          isActive: { field: "isActive", kind: "bool" },
        }),
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
          data: { user, roles },
          total,
          limit,
          offset,
        })
      } catch {
        return ctx.json({
          data: { user, roles: [] },
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
  const paginationConfig = createPaginationConfig(options)

  return createAuthEndpoint(
    "/rbac/get-user-permissions",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z.object({
        userId: z.string().meta({
          description: "The ID of the user.",
        }),
        search: z.string().optional().meta({
          description:
            "The value to search in permissions. Matches permission name or key, case-insensitive.",
        }),
        isActive: zBooleanFilter,
        limit: z
          .string()
          .meta({ description: "The number of permissions to return." })
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
        sortBy: sortByPermission,
        sortDirection,
      }),
      metadata: {
        openapi: {
          operationId: "rbac.getUserPermissions",
          summary: "Get all permissions for a user (from their roles)",
          description:
            "Get all permissions for a user through their assigned roles, with pagination, search and sorting support. Only shows permissions that still exist (orphaned role-permission rows are ignored).",
          parameters: [
            {
              name: "userId",
              in: "query",
              required: true,
              description: "The ID of the user.",
              schema: {
                type: "string",
                example: "user_9mQGfY2Z",
              },
            },
            {
              name: "search",
              in: "query",
              description:
                "The value to search in permissions. Matches permission name or key, case-insensitive.",
              schema: {
                type: "string",
                example: "user:read",
              },
            },
            {
              name: "isActive",
              in: "query",
              description:
                "Filter the returned permissions by their active status. Accepts a boolean (true/1/yes/on, false/0/no/off) or a comma-separated/repeated list.",
              schema: {
                type: "string",
              },
              examples: {
                active: { value: "true" },
                inactive: { value: "false" },
              },
            },
            {
              name: "limit",
              in: "query",
              description: "The number of permissions to return.",
              schema: {
                type: "integer",
                example: "10",
              },
            },
            {
              name: "offset",
              in: "query",
              description: "The offset to start from.",
              schema: {
                type: "integer",
                example: "0",
              },
            },
            {
              name: "sortBy",
              in: "query",
              description:
                "The permission field to sort by. Allowed: id, name, key, isActive, createdAt, updatedAt, createdBy, updatedBy.",
              schema: {
                type: "string",
                enum: [
                  "id",
                  "name",
                  "key",
                  "isActive",
                  "createdAt",
                  "updatedAt",
                  "createdBy",
                  "updatedBy",
                ],
              },
              examples: {
                id: { value: "id" },
                name: { value: "name" },
                key: { value: "key" },
                isActive: { value: "isActive" },
                createdAt: { value: "createdAt" },
                updatedAt: { value: "updatedAt" },
                createdBy: { value: "createdBy" },
                updatedBy: { value: "updatedBy" },
              },
            },
            {
              name: "sortDirection",
              in: "query",
              description: "The direction to sort by.",
              schema: {
                type: "string",
                enum: ["asc", "desc"],
              },
              examples: {
                asc: { value: "asc" },
                desc: { value: "desc" },
              },
            },
          ] satisfies OpenApiParameter[],
          responses: {
            200: {
              description: "User permissions",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        description: "The list payload.",
                        properties: {
                          user: {
                            description: "Minimal user info (id, name, email).",
                            type: "object",
                            properties: {
                              id: {
                                type: "string",
                                description: "The user id.",
                                example: "user_9mQGfY2Z",
                              },
                              name: {
                                type: "string",
                                nullable: true,
                                description: "The user name.",
                                example: "Jane Doe",
                              },
                              email: {
                                type: "string",
                                description: "The user email.",
                                example: "jane@example.com",
                              },
                            },
                          },
                          permissions: {
                            description:
                              "The permissions the user has through their roles.",
                            type: "array",
                            items: {
                              $ref: "#/components/schemas/Permission",
                            },
                          },
                        },
                      },
                      total: {
                        type: "number",
                        description: "Total number of matching records.",
                        example: 42,
                      },
                      limit: {
                        type: "number",
                        description: "Maximum number of records returned.",
                        example: 10,
                      },
                      offset: {
                        type: "number",
                        description: "Offset used for pagination.",
                        example: 0,
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid query parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["code", "message"],
                    properties: {
                      code: {
                        type: "string",
                        enum: ["VALIDATION_ERROR"],
                        description: "The error code.",
                        example: "VALIDATION_ERROR",
                      },
                      message: {
                        type: "string",
                        description: "Human-readable validation error message.",
                        example:
                          "[query.sortDirection] Invalid input: expected 'asc' | 'desc', received 'sideways'",
                      },
                    },
                  },
                  examples: {
                    validationError: {
                      summary: "Invalid query parameters",
                      value: {
                        code: "VALIDATION_ERROR",
                        message:
                          "[query.sortDirection] Invalid input: expected 'asc' | 'desc', received 'sideways'",
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
                    required: ["code", "message"],
                    properties: {
                      code: {
                        type: "string",
                        enum: ["USER_NOT_FOUND"],
                        description: "The error code.",
                        example: "USER_NOT_FOUND",
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.USER_NOT_FOUND.message],
                        description: "Human-readable error message.",
                        example: "User not found.",
                      },
                    },
                  },
                  examples: {
                    userNotFound: {
                      summary: "User not found.",
                      value: {
                        code: "USER_NOT_FOUND",
                        message: "User not found.",
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

      const { userId } = ctx.query

      // Look up the user by ID
      const user = await ctx.context.adapter.findOne<User>({
        model: "user",
        where: [{ field: "id", value: userId }],
        select: ["id", "name", "email"],
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

      // Collect the permission IDs assigned to the user through their roles
      // (deduplicated, since a permission can belong to multiple roles)
      let permissionIds: string[] = []
      if (roleIds.length > 0) {
        const rolePermissions = await ctx.context.adapter.findMany<RolePermission>({
          model: "rolePermission",
          where: [
            {
              field: "roleId",
              operator: "in",
              value: roleIds,
            },
          ],
        })

        permissionIds = [...new Set(rolePermissions.map((rp) => rp.permissionId))]
      }

      // If there are no permissions, return empty result
      if (permissionIds.length === 0) {
        return ctx.json({
          data: { user, permissions: [] },
          total: 0,
          limit,
          offset,
        })
      }

      // Build where clause for permissions (orphaned rows simply don't match,
      // so deleted permissions are handled by construction)
      const where: Where[] = [
        {
          field: "id",
          operator: "in",
          value: permissionIds,
        },
      ]

      // Add search filter over name OR key if provided
      const search = ctx.query?.search?.trim()
      if (search) {
        where.push(
          {
            field: "name",
            operator: "contains",
            value: search,
            connector: "OR",
          },
          {
            field: "key",
            operator: "contains",
            value: search,
            connector: "OR",
          },
        )
      }

      // Add isActive filter if provided
      where.push(
        ...buildFilterWhere(ctx.query as Record<string, unknown>, {
          isActive: { field: "isActive", kind: "bool" },
        }),
      )

      try {
        // Get paginated, sorted and filtered permissions
        const permissions = await ctx.context.adapter.findMany<Permission>({
          model: "permission",
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

        // Get total count of filtered permissions
        const total = await ctx.context.adapter.count({
          model: "permission",
          where: where.length ? where : undefined,
        })

        return ctx.json({
          data: { user, permissions },
          total,
          limit,
          offset,
        })
      } catch {
        return ctx.json({
          data: { user, permissions: [] },
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
          example: "user_9mQGfY2Z",
        }),
        roleIds: z.array(z.string()).meta({
          description: "Array of role IDs to set for the user.",
          example: ["role_8xKdMqQ2", "role_7jOpYz83"],
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.setUserRoles",
          summary: "Set roles for a user",
          description:
            "Replace user's current roles with the provided array of role IDs. Adds new roles, removes old ones, and keeps existing ones.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: {
                      type: "string",
                      description: "The id of the user.",
                      example: "user_9mQGfY2Z",
                    },
                    roleIds: {
                      type: "array",
                      description: "Array of role IDs to set for the user.",
                      items: { type: "string" },
                      example: ["role_8xKdMqQ2", "role_7jOpYz83"],
                    },
                  },
                  required: ["userId", "roleIds"],
                },
              },
            },
          },
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        enum: ["User roles updated successfully"],
                        description:
                          "Human-readable result. Always `User roles updated successfully`. The number of roles added, removed and kept is reported in the `added`, `removed` and `kept` counters.",
                        example: "User roles updated successfully",
                      },
                      added: {
                        type: "number",
                        description: "Number of roles added",
                        example: 2,
                      },
                      removed: {
                        type: "number",
                        description: "Number of roles removed",
                        example: 1,
                      },
                      kept: {
                        type: "number",
                        description: "Number of roles kept unchanged",
                        example: 1,
                      },
                    },
                  },
                  examples: {
                    updated: {
                      summary: "Roles set for user",
                      value: {
                        success: true,
                        message: "User roles updated successfully",
                        added: 2,
                        removed: 1,
                        kept: 1,
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
                        description: "The error code.",
                        example: "BATCH_TOO_LARGE",
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.BATCH_TOO_LARGE.message],
                        description: "Human-readable error message.",
                        example: "Too many ids provided in a single request.",
                      },
                      details: {
                        type: "object",
                        description:
                          "Present when code is BATCH_TOO_LARGE. Describes the array field that exceeded the `maxBatchAssignmentSize` cap.",
                        properties: {
                          ids: {
                            type: "string",
                            description: "The id array field that exceeded the cap.",
                            example: "roleIds",
                          },
                          provided: {
                            type: "number",
                            description:
                              "Number of unique ids provided in the request.",
                            example: 15,
                          },
                          maxBatchAssignmentSize: {
                            type: "number",
                            description: "The configured cap that was exceeded.",
                            example: 10,
                          },
                        },
                      },
                    },
                  },
                  examples: {
                    batchTooLarge: {
                      summary: "Too many ids provided in a single request.",
                      value: {
                        code: "BATCH_TOO_LARGE",
                        message: "Too many ids provided in a single request.",
                        details: {
                          ids: "roleIds",
                          provided: 15,
                          maxBatchAssignmentSize: 10,
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
                        description: "The error code.",
                        example: "USER_NOT_FOUND",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.USER_NOT_FOUND.message,
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                        ],
                        description:
                          "Human-readable error message. `User not found.` when the user does not exist, `Role not found.` when one of the roles was not found.",
                        example: "User not found.",
                      },
                      details: {
                        type: "object",
                        description:
                          "Present when code is ROLE_NOT_FOUND. The role ids that were not found.",
                        properties: {
                          missingRoleIds: {
                            type: "array",
                            description: "The role ids that were not found.",
                            items: { type: "string" },
                            example: ["role_zzZz9xQp"],
                          },
                        },
                      },
                    },
                  },
                  examples: {
                    userNotFound: {
                      summary: "User not found.",
                      value: {
                        code: "USER_NOT_FOUND",
                        message: "User not found.",
                      },
                    },
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
                        details: {
                          missingRoleIds: ["role_zzZz9xQp"],
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
          parameters: [
            {
              name: "onlyActive",
              in: "query",
              description:
                "Filter to return only active users (not banned). Accepts a boolean (true/1/yes/on, false/0/no/off). Defaults to false.",
              schema: {
                type: "string",
              },
              examples: {
                active: { value: "true" },
                all: { value: "false" },
              },
            },
            {
              name: "search",
              in: "query",
              description: "Search term to filter users by email or name.",
              schema: {
                type: "string",
                example: "john",
              },
            },
            {
              name: "limit",
              in: "query",
              description: "Maximum number of results to return.",
              schema: {
                type: "integer",
                example: "10",
              },
            },
            {
              name: "sortBy",
              in: "query",
              description:
                "The user field to sort by. Allowed: id, name, email, banned, createdAt, updatedAt.",
              schema: {
                type: "string",
                enum: ["id", "name", "email", "banned", "createdAt", "updatedAt"],
              },
              examples: {
                name: { value: "name" },
                email: { value: "email" },
                createdAt: { value: "createdAt" },
              },
            },
            {
              name: "sortDirection",
              in: "query",
              description: "The direction to sort by. Defaults to asc.",
              schema: {
                type: "string",
                enum: ["asc", "desc"],
              },
              examples: {
                asc: { value: "asc" },
                desc: { value: "desc" },
              },
            },
          ] satisfies OpenApiParameter[],
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
                        description: "The users that matched the filters.",
                        items: {
                          type: "object",
                          required: ["value", "label"],
                          properties: {
                            value: {
                              type: "string",
                              description: "User ID",
                              example: "user_9mQGfY2Z",
                            },
                            label: {
                              type: "string",
                              description: "User email address",
                              example: "john.doe@example.com",
                            },
                            name: {
                              type: "string",
                              nullable: true,
                              description:
                                "User display name. Null when the user has no name set.",
                              example: "John Doe",
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
                            value: "user_9mQGfY2Z",
                            label: "john.doe@example.com",
                            name: "John Doe",
                          },
                          {
                            value: "user_2pQkLmW6",
                            label: "jane.smith@example.com",
                            name: "Jane Smith",
                          },
                          {
                            value: "user_1aBcDeF3",
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
                            value: "user_9mQGfY2Z",
                            label: "john.doe@example.com",
                            name: "John Doe",
                          },
                          {
                            value: "user_2pQkLmW6",
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
            400: {
              description: "Invalid query parameters.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["code", "message"],
                    properties: {
                      code: {
                        type: "string",
                        enum: ["VALIDATION_ERROR"],
                        description: "The error code.",
                        example: "VALIDATION_ERROR",
                      },
                      message: {
                        type: "string",
                        description: "Human-readable validation error message.",
                        example:
                          "[query.sortDirection] Invalid input: expected 'asc' | 'desc', received 'sideways'",
                      },
                    },
                  },
                  examples: {
                    validationError: {
                      summary: "Invalid query parameters",
                      value: {
                        code: "VALIDATION_ERROR",
                        message:
                          "[query.sortDirection] Invalid input: expected 'asc' | 'desc', received 'sideways'",
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
          example: "user_9mQGfY2Z",
        }),
        roleIds: z
          .array(z.string())
          .optional()
          .meta({
            description: "Optional array of role IDs to replace current user roles.",
            example: ["role_8xKdMqQ2", "role_7jOpYz83"],
          }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.updateUser",
          summary: "Update user roles",
          description:
            "Update user's roles. Replace current roles with the provided array of role IDs.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userId: {
                      type: "string",
                      description: "The id of the user to update.",
                      example: "user_9mQGfY2Z",
                    },
                    roleIds: {
                      type: "array",
                      description:
                        "Optional array of role IDs to replace current user roles.",
                      items: { type: "string" },
                      example: ["role_8xKdMqQ2", "role_7jOpYz83"],
                    },
                  },
                  required: ["userId"],
                },
              },
            },
          },
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
                        description: "The error code.",
                        example: "BATCH_TOO_LARGE",
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.BATCH_TOO_LARGE.message],
                        description: "Human-readable error message.",
                        example: "Too many ids provided in a single request.",
                      },
                      details: {
                        type: "object",
                        description:
                          "Present when code is BATCH_TOO_LARGE. Describes the array field that exceeded the `maxBatchAssignmentSize` cap.",
                        properties: {
                          ids: {
                            type: "string",
                            description: "The id array field that exceeded the cap.",
                            example: "roleIds",
                          },
                          provided: {
                            type: "number",
                            description:
                              "Number of unique ids provided in the request.",
                            example: 15,
                          },
                          maxBatchAssignmentSize: {
                            type: "number",
                            description: "The configured cap that was exceeded.",
                            example: 10,
                          },
                        },
                      },
                    },
                  },
                  examples: {
                    batchTooLarge: {
                      summary: "Too many ids provided in a single request.",
                      value: {
                        code: "BATCH_TOO_LARGE",
                        message: "Too many ids provided in a single request.",
                        details: {
                          ids: "roleIds",
                          provided: 15,
                          maxBatchAssignmentSize: 10,
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
                        description: "The error code.",
                        example: "USER_NOT_FOUND",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.USER_NOT_FOUND.message,
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                        ],
                        description:
                          "Human-readable error message. `User not found.` when the user does not exist, `Role not found.` when one of the roles was not found.",
                        example: "User not found.",
                      },
                      details: {
                        type: "object",
                        description:
                          "Present when code is ROLE_NOT_FOUND. The role ids that were not found.",
                        properties: {
                          missingRoleIds: {
                            type: "array",
                            description: "The role ids that were not found.",
                            items: { type: "string" },
                            example: ["role_zzZz9xQp"],
                          },
                        },
                      },
                    },
                  },
                  examples: {
                    userNotFound: {
                      summary: "User not found.",
                      value: {
                        code: "USER_NOT_FOUND",
                        message: "User not found.",
                      },
                    },
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
                        details: {
                          missingRoleIds: ["role_zzZz9xQp"],
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
