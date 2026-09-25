import type { Where } from "better-auth"
import { APIError, createAuthEndpoint } from "better-auth/api"
import * as z from "zod"
import {
  buildFilterWhere,
  zBooleanFilter,
  zDayFilter,
  type FilterFieldConfig,
} from "../../shared/filters"
import type { OpenApiParameter } from "../../shared/openapi-types"
import {
  createPaginationConfig,
  createValidationOptions,
  ensureUserIsAdmin,
  rbacMiddleware,
} from "../call"
import { RBAC_ERROR_CODES } from "../error-codes"
import type {
  Permission,
  PermissionCreateInput,
  RBACPluginOptions,
  Role,
  RolePermission,
  RolePermissionCreateInput,
} from "../types"
import {
  dedupeIds,
  findMissingIds,
  getPaginationParams,
  normalizeIdBatch,
} from "../utils"
import { validateKey } from "../validation"
import { sortByPermission, sortByRole, sortDirection } from "./sort-schemas"

/**
 * ### Endpoint
 *
 * GET `/rbac/list-permissions`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacListPermissions`
 *
 * **client:**
 * `authClient.rbac.listPermissions`
 */
export const rbacListPermissions = <O extends RBACPluginOptions>(options: O) => {
  const paginationConfig = createPaginationConfig(options)

  return createAuthEndpoint(
    "/rbac/list-permissions",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z.object({
        searchValue: z.string().optional().meta({
          description: "The value to search.",
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
        isActive: zBooleanFilter,
        isSystem: zBooleanFilter,
        createdAt: zDayFilter,
        createdFrom: zDayFilter,
        createdTo: zDayFilter,
        updatedAt: zDayFilter,
        updatedFrom: zDayFilter,
        updatedTo: zDayFilter,
      }),
      metadata: {
        openapi: {
          operationId: "rbac.listPermissions",
          summary: "List permissions",
          description:
            "List permissions with pagination, search, sorting and typed filters. Returns the matching permissions plus the total count, limit and offset used.",
          parameters: [
            {
              name: "searchValue",
              in: "query",
              description: "The value to search.",
              schema: {
                type: "string",
                example: "user:read",
              },
            },
            {
              name: "searchField",
              in: "query",
              description:
                "The field to search in, defaults to name. Can be `name` or `key`.",
              schema: {
                type: "string",
                enum: ["name", "key"],
              },
              examples: {
                name: { value: "name" },
                key: { value: "key" },
              },
            },
            {
              name: "searchOperator",
              in: "query",
              description: "The operator to use for the search.",
              schema: {
                type: "string",
                enum: ["contains", "starts_with", "ends_with"],
              },
              examples: {
                contains: {
                  summary: "Partial match",
                  description: "Returns any record that contains the entered substring",
                  value: "contains",
                },
                starts_with: {
                  summary: "Starts with",
                  description: "Returns records that start exactly with the given term",
                  value: "starts_with",
                },
                ends_with: {
                  summary: "Ends with",
                  description: "Returns records that end with the specified term",
                  value: "ends_with",
                },
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
              name: "isSystem",
              in: "query",
              description:
                "Filter by system status. Accepts a boolean (true/1/yes/on, false/0/no/off) or a comma-separated/repeated list.",
              schema: {
                type: "string",
              },
              examples: {
                system: { value: "true" },
                user_created: { value: "false" },
              },
            },
            {
              name: "createdAt",
              in: "query",
              description: "Filter by creation day (YYYY-MM-DD, UTC).",
              schema: {
                type: "string",
                example: "2026-09-22",
              },
            },
            {
              name: "createdFrom",
              in: "query",
              description: "Filter by creation day start (inclusive, YYYY-MM-DD).",
              schema: {
                type: "string",
                example: "2026-09-01",
              },
            },
            {
              name: "createdTo",
              in: "query",
              description: "Filter by creation day end (exclusive, YYYY-MM-DD).",
              schema: {
                type: "string",
                example: "2026-09-22",
              },
            },
            {
              name: "updatedAt",
              in: "query",
              description: "Filter by last update day (YYYY-MM-DD, UTC).",
              schema: {
                type: "string",
                example: "2026-09-22",
              },
            },
            {
              name: "updatedFrom",
              in: "query",
              description: "Filter by last update day start (inclusive, YYYY-MM-DD).",
              schema: {
                type: "string",
                example: "2026-09-01",
              },
            },
            {
              name: "updatedTo",
              in: "query",
              description: "Filter by last update day end (exclusive, YYYY-MM-DD).",
              schema: {
                type: "string",
                example: "2026-09-22",
              },
            },
          ] satisfies OpenApiParameter[],
          responses: {
            200: {
              description: "List permissions",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        description: "The list payload.",
                        type: "object",
                        properties: {
                          permissions: {
                            description: "The list payload items.",
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
                  examples: {
                    permissions: {
                      summary: "List of permissions",
                      value: {
                        data: {
                          permissions: [
                            {
                              id: "permission_2nQxLvK8",
                              name: "Create Post",
                              key: "post:create",
                              description: "Allows creating posts.",
                              isActive: true,
                              isSystem: false,
                              createdAt: "2026-09-18T15:04:05.000Z",
                              updatedAt: "2026-09-20T09:12:33.000Z",
                              createdBy: "admin@app.dev",
                              updatedBy: "admin@app.dev",
                            },
                          ],
                        },
                        total: 42,
                        limit: 10,
                        offset: 0,
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
      if (options.disabledEndpoints?.includes("listPermissions")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      const where: Where[] = []

      if (ctx.query?.searchValue) {
        where.push({
          field: ctx.query.searchField || "name",
          operator: ctx.query.searchOperator || "contains",
          value: ctx.query.searchValue,
        })
      }

      const permissionFilters: Record<string, FilterFieldConfig> = {
        isActive: { field: "isActive", kind: "bool" },
        isSystem: { field: "isSystem", kind: "bool" },
        createdAt: { field: "createdAt", kind: "day" },
        createdFrom: { field: "createdAt", kind: "dateFrom" },
        createdTo: { field: "createdAt", kind: "dateTo" },
        updatedAt: { field: "updatedAt", kind: "day" },
        updatedFrom: { field: "updatedAt", kind: "dateFrom" },
        updatedTo: { field: "updatedAt", kind: "dateTo" },
      }

      where.push(
        ...buildFilterWhere(ctx.query as Record<string, unknown>, permissionFilters),
      )

      const { limit, offset } = getPaginationParams(
        ctx.query?.limit,
        ctx.query?.offset,
        paginationConfig,
      )

      try {
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

        const total = await ctx.context.adapter.count({
          model: "permission",
          where: where.length ? where : undefined,
        })

        return ctx.json({
          data: { permissions },
          total,
          limit,
          offset,
        })
      } catch {
        return ctx.json({
          data: { permissions: [] },
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
 * GET `/rbac/get-permission`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacGetPermission`
 *
 * **client:**
 * `authClient.rbac.getPermission`
 */
export const rbacGetPermission = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/get-permission",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z.object({
        id: z.string().meta({
          description: "The id of the permission.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.getPermission",
          summary: "Get an existing permission",
          description:
            "Get a single permission by id, including its system flag and audit metadata.",
          parameters: [
            {
              name: "id",
              in: "query",
              required: true,
              description: "The id of the permission.",
              schema: {
                type: "string",
                example: "permission_2nQxLvK8",
              },
            },
          ] satisfies OpenApiParameter[],
          responses: {
            200: {
              description: "Permission",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      permission: {
                        $ref: "#/components/schemas/Permission",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "Permission not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["PERMISSION_NOT_FOUND"],
                        description: "The error code.",
                        example: "PERMISSION_NOT_FOUND",
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message],
                        description: "Human-readable error message.",
                        example: "Permission not found.",
                      },
                    },
                  },
                  examples: {
                    permissionNotFound: {
                      summary: "Permission not found.",
                      value: {
                        code: "PERMISSION_NOT_FOUND",
                        message: "Permission not found.",
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
      if (options.disabledEndpoints?.includes("getPermission")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      const permission = await ctx.context.adapter.findOne<Permission>({
        model: "permission",
        where: [
          {
            field: "id",
            value: ctx.query.id,
          },
        ],
      })

      if (!permission) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.PERMISSION_NOT_FOUND)
      }

      return ctx.json({
        permission,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/create-permission`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacCreatePermission`
 *
 * **client:**
 * `authClient.rbac.createPermission`
 */
export const rbacCreatePermission = <O extends RBACPluginOptions>(options: O) => {
  const validationOptions = createValidationOptions(options)

  return createAuthEndpoint(
    "/rbac/create-permission",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        name: z.string().trim().min(1).meta({
          description: "The name of the permission.",
          example: "Create Post",
        }),
        key: z.string().trim().min(1).meta({
          description: "The unique key for the permission.",
          example: "post:create",
        }),
        description: z.string().trim().min(1).meta({
          description: "The description of the permission.",
          example: "Allows creating posts.",
        }),
        isActive: z.boolean().optional().meta({
          description:
            "Optional flag to set permission active status. Defaults to true.",
          example: true,
        }),
        roleIds: z
          .array(z.string())
          .optional()
          .meta({
            description: "Optional array of role IDs to assign this permission to.",
            example: ["role_8xKdMqQ2", "role_7jOpYz83"],
          }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.createPermission",
          summary: "Create a new permission",
          description:
            "Create a new permission. Optionally assign it to a set of roles in the same call.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      description: "The name of the permission.",
                      example: "Create Post",
                    },
                    key: {
                      type: "string",
                      description: "The unique key for the permission.",
                      example: "post:create",
                    },
                    description: {
                      type: "string",
                      description: "The description of the permission.",
                      example: "Allows creating posts.",
                    },
                    isActive: {
                      type: "boolean",
                      description:
                        "Optional flag to set permission active status. Defaults to true.",
                      example: true,
                    },
                    roleIds: {
                      type: "array",
                      description:
                        "Optional array of role IDs to assign this permission to.",
                      items: { type: "string" },
                      example: ["role_8xKdMqQ2", "role_7jOpYz83"],
                    },
                  },
                  required: ["name", "key", "description"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Permission created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      permission: {
                        $ref: "#/components/schemas/Permission",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Permission already exists, batch size cap was exceeded or the key is invalid",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: [
                          "PERMISSION_ALREADY_EXISTS",
                          "BATCH_TOO_LARGE",
                          "EMPTY_PERMISSION_KEY",
                          "INVALID_PERMISSION_KEY_LENGTH",
                          "INVALID_PERMISSION_KEY_FORMAT",
                        ],
                        description: "The error code.",
                        example: "PERMISSION_ALREADY_EXISTS",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.PERMISSION_ALREADY_EXISTS.message,
                          RBAC_ERROR_CODES.BATCH_TOO_LARGE.message,
                          RBAC_ERROR_CODES.EMPTY_PERMISSION_KEY.message,
                          RBAC_ERROR_CODES.INVALID_PERMISSION_KEY_LENGTH.message,
                          options.permissionKeyErrorMessage ??
                            RBAC_ERROR_CODES.INVALID_PERMISSION_KEY_FORMAT.message,
                        ],
                        description:
                          "Human-readable error message. See `code` for the specific validation/conflict error.",
                        example: "Permission with this key already exists.",
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
                    permissionAlreadyExists: {
                      summary: "Permission with this key already exists.",
                      value: {
                        code: "PERMISSION_ALREADY_EXISTS",
                        message: "Permission with this key already exists.",
                      },
                    },
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
                    emptyPermissionKey: {
                      summary: "Permission key cannot be empty.",
                      value: {
                        code: "EMPTY_PERMISSION_KEY",
                        message: "Permission key cannot be empty.",
                      },
                    },
                    invalidPermissionKeyLength: {
                      summary: "Permission with this key already exists.",
                      value: {
                        code: "INVALID_PERMISSION_KEY_LENGTH",
                        message: "Permission with this key already exists.",
                      },
                    },
                    invalidPermissionKeyFormat: {
                      summary: "Permission key does not match the configured format.",
                      value: {
                        code: "INVALID_PERMISSION_KEY_FORMAT",
                        message: "Permission key does not match the configured format.",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "Role not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["ROLE_NOT_FOUND"],
                        description: "The error code.",
                        example: "ROLE_NOT_FOUND",
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_NOT_FOUND.message],
                        description: "Human-readable error message.",
                        example: "Role not found.",
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
      if (options.disabledEndpoints?.includes("createPermission")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      const key = validateKey("permission", ctx.body.key, validationOptions)

      // Check if permission with the same key already exists
      const existingPermission = await ctx.context.adapter.findOne<Permission>({
        model: "permission",
        where: [
          {
            field: "key",
            value: key,
          },
        ],
      })

      if (existingPermission) {
        throw APIError.from("BAD_REQUEST", RBAC_ERROR_CODES.PERMISSION_ALREADY_EXISTS)
      }

      // Dedupe role ids and enforce the batch size cap
      const roleIds = ctx.body.roleIds
        ? normalizeIdBatch(ctx.body.roleIds, options, "roleIds")
        : undefined

      // If roleIds provided, validate they exist (single batched query)
      if (roleIds && roleIds.length > 0) {
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

      const permission = await ctx.context.adapter.create<
        PermissionCreateInput,
        Permission
      >({
        model: "permission",
        data: {
          name: ctx.body.name,
          key,
          description: ctx.body.description,
          isActive: ctx.body.isActive ?? true,
          createdBy: session.user.email,
          updatedBy: session.user.email,
        },
      })

      // Assign to roles if provided (in parallel for better performance)
      if (roleIds && roleIds.length > 0) {
        await Promise.all(
          roleIds.map((roleId) =>
            ctx.context.adapter.create<RolePermissionCreateInput, RolePermission>({
              model: "rolePermission",
              data: {
                roleId: roleId,
                permissionId: permission.id,
              },
            }),
          ),
        )
      }

      return ctx.json({
        permission,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/clone-permission`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacClonePermission`
 *
 * **client:**
 * `authClient.rbac.clonePermission`
 */
export const rbacClonePermission = <O extends RBACPluginOptions>(options: O) => {
  const validationOptions = createValidationOptions(options)

  return createAuthEndpoint(
    "/rbac/clone-permission",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        id: z.string().meta({
          description: "The id of the permission to clone.",
          example: "permission_2nQxLvK8",
        }),
        name: z.string().trim().min(1).meta({
          description: "The name of the cloned permission.",
          example: "Delete Post (Copy)",
        }),
        key: z.string().trim().min(1).meta({
          description: "The unique key for the cloned permission.",
          example: "post:delete_copy",
        }),
        description: z.string().trim().min(1).optional().meta({
          description:
            "Optional description of the cloned permission. Defaults to the source permission value.",
          example: "Same as Delete Post, for staging.",
        }),
        isActive: z.boolean().optional().meta({
          description:
            "Optional flag to set permission active status. Defaults to the source permission value.",
          example: true,
        }),
        copyRoles: z.boolean().optional().default(true).meta({
          description:
            "Whether to copy the role assignments from the source permission. Defaults to true.",
          example: true,
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.clonePermission",
          summary: "Clone an existing permission",
          description:
            "Create a copy of an existing permission, optionally copying its role assignments.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "The id of the permission to clone.",
                      example: "permission_2nQxLvK8",
                    },
                    name: {
                      type: "string",
                      description: "The name of the cloned permission.",
                      example: "Delete Post (Copy)",
                    },
                    key: {
                      type: "string",
                      description: "The unique key for the cloned permission.",
                      example: "post:delete_copy",
                    },
                    description: {
                      type: "string",
                      description:
                        "Optional description of the cloned permission. Defaults to the source permission value.",
                      example: "Same as Delete Post, for staging.",
                    },
                    isActive: {
                      type: "boolean",
                      description:
                        "Optional flag to set permission active status. Defaults to the source permission value.",
                      example: true,
                    },
                    copyRoles: {
                      type: "boolean",
                      description:
                        "Whether to copy the role assignments from the source permission. Defaults to true.",
                      example: true,
                    },
                  },
                  required: ["id", "name", "key"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Permission cloned successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      permission: {
                        $ref: "#/components/schemas/Permission",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "Permission or role not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["ROLE_NOT_FOUND", "PERMISSION_NOT_FOUND"],
                        description: "The error code.",
                        example: "ROLE_NOT_FOUND",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                          RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message,
                        ],
                        description:
                          "Human-readable error message. `Role not found.` when one of the roles to copy was not found, `Permission not found.` when the source permission does not exist.",
                        example: "Role not found.",
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
                    permissionNotFound: {
                      summary: "Permission not found.",
                      value: {
                        code: "PERMISSION_NOT_FOUND",
                        message: "Permission not found.",
                      },
                    },
                  },
                },
              },
              400: {
                description: "Permission key already exists or the key is invalid",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string",
                          enum: [
                            "PERMISSION_ALREADY_EXISTS",
                            "EMPTY_PERMISSION_KEY",
                            "INVALID_PERMISSION_KEY_LENGTH",
                            "INVALID_PERMISSION_KEY_FORMAT",
                          ],
                          description: "The error code.",
                          example: "PERMISSION_ALREADY_EXISTS",
                        },
                        message: {
                          type: "string",
                          enum: [
                            RBAC_ERROR_CODES.PERMISSION_ALREADY_EXISTS.message,
                            RBAC_ERROR_CODES.EMPTY_PERMISSION_KEY.message,
                            RBAC_ERROR_CODES.INVALID_PERMISSION_KEY_LENGTH.message,
                            options.permissionKeyErrorMessage ??
                              RBAC_ERROR_CODES.INVALID_PERMISSION_KEY_FORMAT.message,
                          ],
                          description:
                            "Human-readable error message. See `code` for the specific conflict/validation error.",
                          example: "Permission with this key already exists.",
                        },
                      },
                    },
                    examples: {
                      permissionAlreadyExists: {
                        summary: "Permission with this key already exists.",
                        value: {
                          code: "PERMISSION_ALREADY_EXISTS",
                          message: "Permission with this key already exists.",
                        },
                      },
                      emptyPermissionKey: {
                        summary: "Permission key cannot be empty.",
                        value: {
                          code: "EMPTY_PERMISSION_KEY",
                          message: "Permission key cannot be empty.",
                        },
                      },
                      invalidPermissionKeyLength: {
                        summary: "Permission with this key already exists.",
                        value: {
                          code: "INVALID_PERMISSION_KEY_LENGTH",
                          message: "Permission with this key already exists.",
                        },
                      },
                      invalidPermissionKeyFormat: {
                        summary: "Permission key does not match the configured format.",
                        value: {
                          code: "INVALID_PERMISSION_KEY_FORMAT",
                          message:
                            "Permission key does not match the configured format.",
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
      if (options.disabledEndpoints?.includes("clonePermission")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Find the source permission
      const sourcePermission = await ctx.context.adapter.findOne<Permission>({
        model: "permission",
        where: [
          {
            field: "id",
            value: ctx.body.id,
          },
        ],
      })

      if (!sourcePermission) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.PERMISSION_NOT_FOUND)
      }

      // Validate the new permission key
      const key = validateKey("permission", ctx.body.key, validationOptions)

      // Check if a permission with the same key already exists
      const existingPermission = await ctx.context.adapter.findOne<Permission>({
        model: "permission",
        where: [
          {
            field: "key",
            value: key,
          },
        ],
      })

      if (existingPermission) {
        throw APIError.from("BAD_REQUEST", RBAC_ERROR_CODES.PERMISSION_ALREADY_EXISTS)
      }

      // Gather roles to copy from the source permission
      let roleIds: string[] = []
      if (ctx.body.copyRoles) {
        const rolePermissions = await ctx.context.adapter.findMany<RolePermission>({
          model: "rolePermission",
          where: [
            {
              field: "permissionId",
              value: sourcePermission.id,
            },
          ],
        })

        roleIds = dedupeIds(rolePermissions.map((rp) => rp.roleId))

        // Validate roles exist (single batched query)
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

      // Create the cloned permission
      const permission = await ctx.context.adapter.create<
        PermissionCreateInput,
        Permission
      >({
        model: "permission",
        data: {
          name: ctx.body.name,
          key,
          description: ctx.body.description ?? sourcePermission.description,
          isActive: ctx.body.isActive ?? sourcePermission.isActive,
          createdBy: session.user.email,
          updatedBy: session.user.email,
        },
      })

      // Copy role assignments to the cloned permission
      if (roleIds.length > 0) {
        await Promise.all(
          roleIds.map((roleId) =>
            ctx.context.adapter.create<RolePermissionCreateInput, RolePermission>({
              model: "rolePermission",
              data: {
                roleId: roleId,
                permissionId: permission.id,
              },
            }),
          ),
        )
      }

      return ctx.json({
        permission,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/update-permission`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacUpdatePermission`
 *
 * **client:**
 * `authClient.rbac.updatePermission`
 */
export const rbacUpdatePermission = <O extends RBACPluginOptions>(options: O) => {
  const validationOptions = createValidationOptions(options)

  return createAuthEndpoint(
    "/rbac/update-permission",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        id: z.string().meta({
          description: "The id of the permission to update.",
          example: "permission_2nQxLvK8",
        }),
        name: z.string().trim().min(1).optional().meta({
          description: "The new name of the permission.",
          example: "Create Article",
        }),
        key: z.string().trim().min(1).optional().meta({
          description: "The new key for the permission.",
          example: "article:create",
        }),
        description: z.string().trim().min(1).optional().meta({
          description: "The new description of the permission.",
          example: "Allows creating articles.",
        }),
        isActive: z.boolean().optional().meta({
          description: "Optional flag to set permission active status.",
          example: true,
        }),
        roleIds: z
          .array(z.string())
          .optional()
          .meta({
            description:
              "Optional array of role IDs to replace current role assignments.",
            example: ["role_8xKdMqQ2"],
          }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.updatePermission",
          summary: "Update an existing permission",
          description:
            "Update an existing permission. When `roleIds` is provided it replaces the current roles the permission is assigned to.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "The id of the permission to update.",
                      example: "permission_2nQxLvK8",
                    },
                    name: {
                      type: "string",
                      description: "The new name of the permission.",
                      example: "Create Article",
                    },
                    key: {
                      type: "string",
                      description: "The new key for the permission.",
                      example: "article:create",
                    },
                    description: {
                      type: "string",
                      description: "The new description of the permission.",
                      example: "Allows creating articles.",
                    },
                    isActive: {
                      type: "boolean",
                      description: "Optional flag to set permission active status.",
                      example: true,
                    },
                    roleIds: {
                      type: "array",
                      description:
                        "Optional array of role IDs to replace current role assignments.",
                      items: { type: "string" },
                      example: ["role_8xKdMqQ2"],
                    },
                  },
                  required: ["id"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Permission updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      permission: {
                        $ref: "#/components/schemas/Permission",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "Role or permission not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["ROLE_NOT_FOUND", "PERMISSION_NOT_FOUND"],
                        description: "The error code.",
                        example: "ROLE_NOT_FOUND",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                          RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message,
                        ],
                        description:
                          "Human-readable error message. `Role not found.` when one of the target roles was not found, `Permission not found.` when the permission does not exist.",
                        example: "Role not found.",
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
                    permissionNotFound: {
                      summary: "Permission not found.",
                      value: {
                        code: "PERMISSION_NOT_FOUND",
                        message: "Permission not found.",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Permission key already exists, batch size cap was exceeded, the permission is a system entity, a target role is a system entity or the key is invalid",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: [
                          "PERMISSION_ALREADY_EXISTS",
                          "BATCH_TOO_LARGE",
                          "CANNOT_MODIFY_SYSTEM_PERMISSION",
                          "CANNOT_MODIFY_SYSTEM_ROLE",
                          "EMPTY_PERMISSION_KEY",
                          "INVALID_PERMISSION_KEY_LENGTH",
                          "INVALID_PERMISSION_KEY_FORMAT",
                        ],
                        description: "The error code.",
                        example: "PERMISSION_ALREADY_EXISTS",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.PERMISSION_ALREADY_EXISTS.message,
                          RBAC_ERROR_CODES.BATCH_TOO_LARGE.message,
                          RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_PERMISSION.message,
                          RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_ROLE.message,
                          RBAC_ERROR_CODES.EMPTY_PERMISSION_KEY.message,
                          RBAC_ERROR_CODES.INVALID_PERMISSION_KEY_LENGTH.message,
                          options.permissionKeyErrorMessage ??
                            RBAC_ERROR_CODES.INVALID_PERMISSION_KEY_FORMAT.message,
                        ],
                        description:
                          "Human-readable error message. See `code` for the specific conflict/validation error.",
                        example: "Permission with this key already exists.",
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
                    permissionAlreadyExists: {
                      summary: "Permission with this key already exists.",
                      value: {
                        code: "PERMISSION_ALREADY_EXISTS",
                        message: "Permission with this key already exists.",
                      },
                    },
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
                    cannotModifySystemPermission: {
                      summary: "Cannot modify system permission.",
                      value: {
                        code: "CANNOT_MODIFY_SYSTEM_PERMISSION",
                        message: "Cannot modify system permission.",
                      },
                    },
                    cannotModifySystemRole: {
                      summary: "Cannot modify system role.",
                      value: {
                        code: "CANNOT_MODIFY_SYSTEM_ROLE",
                        message: "Cannot modify system role.",
                      },
                    },
                    emptyPermissionKey: {
                      summary: "Permission key cannot be empty.",
                      value: {
                        code: "EMPTY_PERMISSION_KEY",
                        message: "Permission key cannot be empty.",
                      },
                    },
                    invalidPermissionKeyLength: {
                      summary: "Permission with this key already exists.",
                      value: {
                        code: "INVALID_PERMISSION_KEY_LENGTH",
                        message: "Permission with this key already exists.",
                      },
                    },
                    invalidPermissionKeyFormat: {
                      summary: "Permission key does not match the configured format.",
                      value: {
                        code: "INVALID_PERMISSION_KEY_FORMAT",
                        message: "Permission key does not match the configured format.",
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
      if (options.disabledEndpoints?.includes("updatePermission")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      const key =
        ctx.body.key !== undefined
          ? validateKey("permission", ctx.body.key, validationOptions)
          : undefined

      // Check if permission exists
      const existingPermission = await ctx.context.adapter.findOne<Permission>({
        model: "permission",
        where: [
          {
            field: "id",
            value: ctx.body.id,
          },
        ],
      })

      if (!existingPermission) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.PERMISSION_NOT_FOUND)
      }

      if (existingPermission.isSystem) {
        const mode = options.systemProtectionMode ?? "strict"
        if (mode === "strict") {
          throw APIError.from(
            "BAD_REQUEST",
            RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_PERMISSION,
          )
        }
        // In "allow_metadata_edit" mode, only name and description are editable;
        // forbid modifying key, isActive or role assignments
        if (
          (key !== undefined && key !== existingPermission.key) ||
          (ctx.body.isActive !== undefined &&
            ctx.body.isActive !== existingPermission.isActive) ||
          ctx.body.roleIds !== undefined
        ) {
          throw APIError.from(
            "BAD_REQUEST",
            RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_PERMISSION,
          )
        }
      }

      // If updating key, check if new key already exists
      if (key && key !== existingPermission.key) {
        const duplicatePermission = await ctx.context.adapter.findOne<Permission>({
          model: "permission",
          where: [
            {
              field: "key",
              value: key,
            },
          ],
        })

        if (duplicatePermission) {
          throw APIError.from("BAD_REQUEST", RBAC_ERROR_CODES.PERMISSION_ALREADY_EXISTS)
        }
      }

      // Dedupe role ids and enforce the batch size cap
      const roleIds = ctx.body.roleIds
        ? normalizeIdBatch(ctx.body.roleIds, options, "roleIds")
        : undefined

      // If roleIds provided, validate they exist and are not system entities
      // (single batched query)
      if (roleIds) {
        const roles = await ctx.context.adapter.findMany<Role>({
          model: "role",
          where: [{ field: "id", operator: "in", value: roleIds }],
        })

        const foundRoleIds = new Set(roles.map((role) => role.id))
        const missingRoleIds = roleIds.filter((id) => !foundRoleIds.has(id))

        if (missingRoleIds.length > 0) {
          throw new APIError("NOT_FOUND", {
            code: RBAC_ERROR_CODES.ROLE_NOT_FOUND.code,
            message: RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
            details: { missingRoleIds },
          })
        }

        if (roles.some((role) => role.isSystem)) {
          throw APIError.from("BAD_REQUEST", RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_ROLE)
        }
      }

      // Update permission
      const updatedPermission = await ctx.context.adapter.update<Permission>({
        model: "permission",
        where: [
          {
            field: "id",
            value: ctx.body.id,
          },
        ],
        update: {
          ...(ctx.body.name !== undefined && { name: ctx.body.name }),
          ...(key !== undefined && { key }),
          ...(ctx.body.description !== undefined && {
            description: ctx.body.description,
          }),
          ...(ctx.body.isActive !== undefined && { isActive: ctx.body.isActive }),
          updatedAt: new Date(),
          updatedBy: session.user.email,
        },
      })

      // Update role assignments if provided (incremental update)
      if (roleIds !== undefined) {
        // Get current role assignments
        const currentAssignments = await ctx.context.adapter.findMany<RolePermission>({
          model: "rolePermission",
          where: [
            {
              field: "permissionId",
              value: ctx.body.id,
            },
          ],
        })

        const currentRoleIds = new Set(currentAssignments.map((rp) => rp.roleId))
        const newRoleIds = new Set(roleIds)

        // Find assignments to delete (exist in current but not in new)
        const toDelete = currentAssignments.filter((rp) => !newRoleIds.has(rp.roleId))

        // Find assignments to add (exist in new but not in current)
        const toAdd = roleIds.filter((roleId) => !currentRoleIds.has(roleId))

        // Delete removed assignments in parallel
        if (toDelete.length > 0) {
          await Promise.all(
            toDelete.map((rp) =>
              ctx.context.adapter.delete<RolePermission>({
                model: "rolePermission",
                where: [
                  {
                    field: "id",
                    value: rp.id,
                  },
                ],
              }),
            ),
          )
        }

        // Create new assignments in parallel
        if (toAdd.length > 0) {
          await Promise.all(
            toAdd.map((roleId) =>
              ctx.context.adapter.create<RolePermissionCreateInput, RolePermission>({
                model: "rolePermission",
                data: {
                  roleId: roleId,
                  permissionId: ctx.body.id,
                },
              }),
            ),
          )
        }
      }

      return ctx.json({
        permission: updatedPermission,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/delete-permission`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacDeletePermission`
 *
 * **client:**
 * `authClient.rbac.deletePermission`
 */
export const rbacDeletePermission = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/delete-permission",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        id: z.string().meta({
          description: "The id of the permission to delete.",
          example: "permission_2nQxLvK8",
        }),
        skipAssignmentCheck: z.boolean().optional().meta({
          description:
            "Skips the assignment check and deletes the permission even if it is assigned to roles. Defaults to false.",
          example: false,
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.deletePermission",
          summary: "Delete a permission",
          description:
            "Delete a permission after cleaning up its role assignments. System permissions cannot be deleted, and permissions assigned to roles are rejected with `CANNOT_DELETE_ASSIGNED_PERMISSION` unless `skipAssignmentCheck` is true.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                      description: "The id of the permission to delete.",
                      example: "permission_2nQxLvK8",
                    },
                    skipAssignmentCheck: {
                      type: "boolean",
                      description:
                        "Skips the assignment check and deletes the permission even if it is assigned to roles. Defaults to false.",
                      example: false,
                    },
                  },
                  required: ["id"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Permission deleted successfully",
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
                        enum: ["Permission deleted successfully"],
                        description:
                          "Human-readable result. Always `Permission deleted successfully`.",
                        example: "Permission deleted successfully",
                      },
                    },
                  },
                  examples: {
                    deleted: {
                      summary: "Permission deleted",
                      value: {
                        success: true,
                        message: "Permission deleted successfully",
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "Permission not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["PERMISSION_NOT_FOUND"],
                        description: "The error code.",
                        example: "PERMISSION_NOT_FOUND",
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message],
                        description: "Human-readable error message.",
                        example: "Permission not found.",
                      },
                    },
                  },
                  examples: {
                    permissionNotFound: {
                      summary: "Permission not found.",
                      value: {
                        code: "PERMISSION_NOT_FOUND",
                        message: "Permission not found.",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Permission is a system entity or is assigned to roles and the assignment check was not skipped",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: [
                          "CANNOT_DELETE_SYSTEM_PERMISSION",
                          "CANNOT_DELETE_ASSIGNED_PERMISSION",
                        ],
                        description: "The error code.",
                        example: "CANNOT_DELETE_ASSIGNED_PERMISSION",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.CANNOT_DELETE_SYSTEM_PERMISSION.message,
                          RBAC_ERROR_CODES.CANNOT_DELETE_ASSIGNED_PERMISSION.message,
                        ],
                        description:
                          "Human-readable error message. `Cannot delete system permission.` for system entities, `Cannot delete permission that is assigned to roles.` when the permission is still assigned and the check was not skipped.",
                        example: "Cannot delete permission that is assigned to roles.",
                      },
                      details: {
                        type: "object",
                        description:
                          "Present when code is CANNOT_DELETE_ASSIGNED_PERMISSION.",
                        properties: {
                          assignedRoles: {
                            type: "number",
                            description:
                              "The number of roles the permission is assigned to.",
                            example: 3,
                          },
                        },
                      },
                    },
                  },
                  examples: {
                    cannotDeleteSystemPermission: {
                      summary: "Cannot delete system permission.",
                      value: {
                        code: "CANNOT_DELETE_SYSTEM_PERMISSION",
                        message: "Cannot delete system permission.",
                      },
                    },
                    cannotDeleteAssignedPermission: {
                      summary: "Cannot delete permission that is assigned to roles.",
                      value: {
                        code: "CANNOT_DELETE_ASSIGNED_PERMISSION",
                        message: "Cannot delete permission that is assigned to roles.",
                        details: {
                          assignedRoles: 3,
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
      if (options.disabledEndpoints?.includes("deletePermission")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Check if permission exists
      const existingPermission = await ctx.context.adapter.findOne<Permission>({
        model: "permission",
        where: [
          {
            field: "id",
            value: ctx.body.id,
          },
        ],
      })

      if (!existingPermission) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.PERMISSION_NOT_FOUND)
      }

      if (existingPermission.isSystem) {
        throw APIError.from(
          "BAD_REQUEST",
          RBAC_ERROR_CODES.CANNOT_DELETE_SYSTEM_PERMISSION,
        )
      }

      // If not skipping the check, block deletion when the permission is assigned to roles
      if (!ctx.body.skipAssignmentCheck) {
        const assignedRoles = await ctx.context.adapter.count({
          model: "rolePermission",
          where: [{ field: "permissionId", value: ctx.body.id }],
        })

        if (assignedRoles > 0) {
          throw new APIError("BAD_REQUEST", {
            code: RBAC_ERROR_CODES.CANNOT_DELETE_ASSIGNED_PERMISSION.code,
            message: RBAC_ERROR_CODES.CANNOT_DELETE_ASSIGNED_PERMISSION.message,
            details: { assignedRoles },
          })
        }
      }

      // Delete associated role-permission mappings to avoid orphans
      await ctx.context.adapter.deleteMany({
        model: "rolePermission",
        where: [{ field: "permissionId", value: ctx.body.id }],
      })

      // Delete permission
      await ctx.context.adapter.delete<Permission>({
        model: "permission",
        where: [
          {
            field: "id",
            value: ctx.body.id,
          },
        ],
      })

      return ctx.json({
        success: true,
        message: "Permission deleted successfully",
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * GET `/rbac/get-permissions-options`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacGetPermissionsOptions`
 *
 * **client:**
 * `authClient.rbac.getPermissionsOptions`
 */
export const rbacGetPermissionsOptions = <O extends RBACPluginOptions>(options: O) => {
  const paginationConfig = createPaginationConfig(options)

  return createAuthEndpoint(
    "/rbac/get-permissions-options",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z.object({
        onlyActive: z.stringbool().or(z.boolean()).optional().default(true).meta({
          description: "Filter to return only active permissions. Defaults to true.",
        }),
        search: z.string().optional().meta({
          description: "Search term to filter permissions by name or key.",
        }),
        limit: z
          .string()
          .transform((val) => parseInt(val, 10))
          .or(z.number())
          .optional()
          .meta({
            description: "Maximum number of results to return.",
          }),
        sortBy: sortByPermission,
        sortDirection,
      }),
      metadata: {
        openapi: {
          operationId: "rbac.getPermissionsOptions",
          summary: "Get permissions as select options",
          description:
            "Get permissions formatted as value/label pairs for select components. Supports search, limit and sorting parameters.",
          parameters: [
            {
              name: "onlyActive",
              in: "query",
              description:
                "Filter to return only active permissions. Accepts a boolean (true/1/yes/on, false/0/no/off). Defaults to true.",
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
              description: "Search term to filter permissions by name or key.",
              schema: {
                type: "string",
                example: "users",
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
                name: { value: "name" },
                key: { value: "key" },
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
              description: "Successfully retrieved permissions options",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      options: {
                        type: "array",
                        description: "The permissions that matched the filters.",
                        items: {
                          type: "object",
                          required: ["value", "label"],
                          properties: {
                            value: {
                              type: "string",
                              description: "Permission ID",
                              example: "permission_2nQxLvK8",
                            },
                            label: {
                              type: "string",
                              description: "Permission name",
                              example: "Read users",
                            },
                            key: {
                              type: "string",
                              description: "Permission key",
                              example: "users:read",
                            },
                          },
                        },
                      },
                    },
                    required: ["options"],
                  },
                  examples: {
                    withResults: {
                      summary: "Successful response with permissions",
                      value: {
                        options: [
                          {
                            value: "permission_2nQxLvK8",
                            label: "Read users",
                            key: "users:read",
                          },
                          {
                            value: "permission_5fRtYmX4",
                            label: "Write users",
                            key: "users:write",
                          },
                          {
                            value: "permission_4nKjSdW6",
                            label: "Delete users",
                            key: "users:delete",
                          },
                        ],
                      },
                    },
                    emptyResults: {
                      summary: "No permissions found",
                      value: {
                        options: [],
                      },
                    },
                    searchFiltered: {
                      summary: "Filtered by search term",
                      value: {
                        options: [
                          {
                            value: "permission_2nQxLvK8",
                            label: "Read users",
                            key: "users:read",
                          },
                          {
                            value: "permission_5fRtYmX4",
                            label: "Write users",
                            key: "users:write",
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
      if (options.disabledEndpoints?.includes("getPermissionsOptions")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      const where: Where[] = []

      if (ctx.query?.onlyActive) {
        where.push({
          field: "isActive",
          value: true,
        })
      }

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

      // Move the search term and limit down to the database
      const { limit } = getPaginationParams(
        ctx.query?.limit,
        undefined,
        paginationConfig,
      )

      try {
        const filteredPermissions = await ctx.context.adapter.findMany<Permission>({
          model: "permission",
          where: where.length ? where : undefined,
          limit,
          select: ["id", "name", "key"],
          sortBy: {
            field: ctx.query?.sortBy || "name",
            direction: ctx.query?.sortDirection || "asc",
          },
        })

        const options = filteredPermissions.map((permission) => ({
          value: permission.id,
          label: permission.name,
          key: permission.key,
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
 * GET `/rbac/get-permission-roles`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacGetPermissionRoles`
 *
 * **client:**
 * `authClient.rbac.getPermissionRoles`
 */
export const rbacGetPermissionRoles = <O extends RBACPluginOptions>(options: O) => {
  const paginationConfig = createPaginationConfig(options)

  return createAuthEndpoint(
    "/rbac/get-permission-roles",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z
        .object({
          permissionId: z.string().optional().meta({
            description: "The ID of the permission.",
          }),
          permissionKey: z.string().optional().meta({
            description: "The key of the permission.",
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
        })
        .refine((data) => data.permissionId || data.permissionKey, {
          message: "Either permissionId or permissionKey is required.",
        })
        .refine((data) => !(data.permissionId && data.permissionKey), {
          message: "Provide either permissionId or permissionKey, not both.",
        }),
      metadata: {
        openapi: {
          operationId: "rbac.getPermissionRoles",
          summary: "Get all roles that include a specific permission",
          description:
            "Returns all roles associated with a given permission, identified by its ID or key, with pagination, search and sorting support.",
          parameters: [
            {
              name: "permissionId",
              in: "query",
              description:
                "The ID of the permission. Required unless permissionKey is provided.",
              schema: {
                type: "string",
                example: "permission_2nQxLvK8",
              },
            },
            {
              name: "permissionKey",
              in: "query",
              description:
                "The key of the permission. Required unless permissionId is provided.",
              schema: {
                type: "string",
                example: "user:read",
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
              description: "List of roles that include the given permission",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: {
                        description: "The list payload.",
                        type: "object",
                        properties: {
                          permission: {
                            $ref: "#/components/schemas/Permission",
                          },
                          roles: {
                            description: "The roles the permission is assigned to.",
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
                        description:
                          "Human-readable validation error message. `Either permissionId or permissionKey is required.` when neither identifier is provided, `Provide either permissionId or permissionKey, not both.` when both are provided.",
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
                      missingPermissionIdentifier: {
                        summary: "Missing identifier",
                        description:
                          "Neither permissionId nor permissionKey was provided.",
                        value: {
                          code: "VALIDATION_ERROR",
                          message: "Either permissionId or permissionKey is required.",
                        },
                      },
                      bothPermissionIdentifiers: {
                        summary: "Conflicting identifiers",
                        description:
                          "Both permissionId and permissionKey were provided.",
                        value: {
                          code: "VALIDATION_ERROR",
                          message:
                            "Provide either permissionId or permissionKey, not both.",
                        },
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: "Permission not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["code", "message"],
                    properties: {
                      code: {
                        type: "string",
                        enum: ["PERMISSION_NOT_FOUND"],
                        description: "The error code.",
                        example: "PERMISSION_NOT_FOUND",
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message],
                        description: "Human-readable error message.",
                        example: "Permission not found.",
                      },
                    },
                  },
                  examples: {
                    permissionNotFound: {
                      summary: "Permission not found.",
                      value: {
                        code: "PERMISSION_NOT_FOUND",
                        message: "Permission not found.",
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
      if (options.disabledEndpoints?.includes("getPermissionRoles")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      const { permissionId, permissionKey } = ctx.query

      let permission: Permission | null = null

      // Look up the permission by ID or key
      if (permissionId) {
        permission = await ctx.context.adapter.findOne({
          model: "permission",
          where: [{ field: "id", value: permissionId }],
        })
      } else if (permissionKey) {
        permission = await ctx.context.adapter.findOne({
          model: "permission",
          where: [{ field: "key", value: permissionKey }],
        })
      }

      // If the permission does not exist, return a 404 error
      if (!permission) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.PERMISSION_NOT_FOUND)
      }

      // Get all role-permission mappings that reference this permission
      const rolePermissions = await ctx.context.adapter.findMany<RolePermission>({
        model: "rolePermission",
        where: [{ field: "permissionId", value: permission.id }],
      })

      // Extract role IDs
      const roleIds = rolePermissions.map((rp) => rp.roleId)

      const { limit, offset } = getPaginationParams(
        ctx.query?.limit,
        ctx.query?.offset,
        paginationConfig,
      )

      // If there are no roles, return empty result
      if (roleIds.length === 0) {
        return ctx.json({
          data: { permission, roles: [] },
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
          data: { permission, roles },
          total,
          limit,
          offset,
        })
      } catch {
        return ctx.json({
          data: { permission, roles: [] },
          total: 0,
          limit,
          offset,
        })
      }
    },
  )
}
