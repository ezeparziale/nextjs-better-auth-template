import type { Where } from "better-auth"
import { APIError, createAuthEndpoint } from "better-auth/api"
import * as z from "zod"
import {
  createPaginationConfig,
  createValidationOptions,
  ensureUserIsAdmin,
  rbacMiddleware,
} from "../call"
import { RBAC_ERROR_CODES } from "../error-codes"
import type { Permission, RBACPluginOptions, Role, RolePermission } from "../types"
import { getPaginationParams } from "../utils"
import { validateKey } from "../validation"

/**
 * ### Endpoint
 *
 * GET `/rbac/list-permissions`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.listPermissions`
 *
 * **client:**
 * `authClient.rbac.listPermissions`
 */
export const listPermissions = <O extends RBACPluginOptions>(options: O) => {
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
          operationId: "rbac.listPermissions",
          summary: "List permissions",
          description: "List permissions",
          responses: {
            200: {
              description: "List permissions",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      permissions: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            permissions: {
                              type: "array",
                              items: {
                                $ref: "#/components/schemas/Permission",
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
          permissions,
          total,
          limit: Number(ctx.query?.limit),
          offset: Number(ctx.query?.offset),
        })
      } catch {
        return ctx.json({
          permissions: [],
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
 * GET `/rbac/get-permission`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.getPermission`
 *
 * **client:**
 * `authClient.rbac.getPermission`
 */
export const getPermission = <O extends RBACPluginOptions>(options: O) => {
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
          description: "Get an existing permission",
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
                      },
                      error: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.PERMISSION_NOT_FOUND],
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
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.PERMISSION_NOT_FOUND,
        })
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
 * `auth.api.createPermission`
 *
 * **client:**
 * `authClient.rbac.createPermission`
 */
export const createPermission = <O extends RBACPluginOptions>(options: O) => {
  const validationOptions = createValidationOptions(options)

  return createAuthEndpoint(
    "/rbac/create-permission",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        name: z.string().meta({
          description: "The name of the permission.",
        }),
        key: z.string().meta({
          description: "The unique key for the permission.",
        }),
        description: z.string().optional().meta({
          description: "Optional description of the permission.",
        }),
        isActive: z.boolean().optional().meta({
          description:
            "Optional flag to set permission active status. Defaults to true.",
        }),
        roleIds: z.array(z.string()).optional().meta({
          description: "Optional array of role IDs to assign this permission to.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.createPermission",
          summary: "Create a new permission",
          description: "Create a new permission",
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
              description: "Permission already exists",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["PERMISSION_ALREADY_EXISTS"],
                      },
                      error: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.PERMISSION_ALREADY_EXISTS],
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
                      },
                      error: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_NOT_FOUND],
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

      validateKey("permission", ctx.body.key, validationOptions)

      // Check if permission with the same key already exists
      const existingPermission = await ctx.context.adapter.findOne<Permission>({
        model: "permission",
        where: [
          {
            field: "key",
            value: ctx.body.key,
          },
        ],
      })

      if (existingPermission) {
        throw new APIError("BAD_REQUEST", {
          message: RBAC_ERROR_CODES.PERMISSION_ALREADY_EXISTS,
        })
      }

      // If roleIds provided, validate they exist
      if (ctx.body.roleIds && ctx.body.roleIds.length > 0) {
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
              message: `Role with id ${roleId} not found`,
            })
          }
        }
      }

      const permission = await ctx.context.adapter.create<Permission>({
        model: "permission",
        data: {
          name: ctx.body.name,
          key: ctx.body.key,
          description: ctx.body.description,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: ctx.body.isActive ?? true,
          createdBy: session.user.email,
          updatedBy: session.user.email,
        },
      })

      // Assign to roles if provided (in parallel for better performance)
      if (ctx.body.roleIds && ctx.body.roleIds.length > 0) {
        await Promise.all(
          ctx.body.roleIds.map((roleId) =>
            ctx.context.adapter.create<RolePermission>({
              model: "rolePermission",
              data: {
                roleId: roleId,
                permissionId: permission.id,
                createdAt: new Date(),
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
 * `auth.api.updatePermission`
 *
 * **client:**
 * `authClient.rbac.updatePermission`
 */
export const updatePermission = <O extends RBACPluginOptions>(options: O) => {
  const validationOptions = createValidationOptions(options)

  return createAuthEndpoint(
    "/rbac/update-permission",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        id: z.string().meta({
          description: "The id of the permission to update.",
        }),
        name: z.string().optional().meta({
          description: "The new name of the permission.",
        }),
        key: z.string().optional().meta({
          description: "The new key for the permission.",
        }),
        description: z.string().optional().meta({
          description: "The new description of the permission.",
        }),
        isActive: z.boolean().optional().meta({
          description: "Optional flag to set permission active status.",
        }),
        roleIds: z.array(z.string()).optional().meta({
          description:
            "Optional array of role IDs to replace current role assignments.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.updatePermission",
          summary: "Update an existing permission",
          description: "Update an existing permission",
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
              description: "Permission not found or Role not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["PERMISSION_NOT_FOUND", "ROLE_NOT_FOUND"],
                      },
                      error: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.PERMISSION_NOT_FOUND,
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND,
                        ],
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Permission key already exists",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["PERMISSION_ALREADY_EXISTS"],
                      },
                      error: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.PERMISSION_ALREADY_EXISTS],
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

      if (ctx.body.key) {
        validateKey("permission", ctx.body.key, validationOptions)
      }

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
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.PERMISSION_NOT_FOUND,
        })
      }

      // If updating key, check if new key already exists
      if (ctx.body.key && ctx.body.key !== existingPermission.key) {
        const duplicatePermission = await ctx.context.adapter.findOne<Permission>({
          model: "permission",
          where: [
            {
              field: "key",
              value: ctx.body.key,
            },
          ],
        })

        if (duplicatePermission) {
          throw new APIError("BAD_REQUEST", {
            message: RBAC_ERROR_CODES.PERMISSION_ALREADY_EXISTS,
          })
        }
      }

      // If roleIds provided, validate they exist
      if (ctx.body.roleIds) {
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
              message: `Role with id ${roleId} not found`,
            })
          }
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
          ...(ctx.body.name && { name: ctx.body.name }),
          ...(ctx.body.key && { key: ctx.body.key }),
          ...(ctx.body.description !== undefined && {
            description: ctx.body.description,
          }),
          ...(ctx.body.isActive !== undefined && { isActive: ctx.body.isActive }),
          updatedAt: new Date(),
          updatedBy: session.user.email,
        },
      })

      // Update role assignments if provided (incremental update)
      if (ctx.body.roleIds !== undefined) {
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
        const newRoleIds = new Set(ctx.body.roleIds)

        // Find assignments to delete (exist in current but not in new)
        const toDelete = currentAssignments.filter((rp) => !newRoleIds.has(rp.roleId))

        // Find assignments to add (exist in new but not in current)
        const toAdd = ctx.body.roleIds.filter((roleId) => !currentRoleIds.has(roleId))

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
              ctx.context.adapter.create<RolePermission>({
                model: "rolePermission",
                data: {
                  roleId: roleId,
                  permissionId: ctx.body.id,
                  createdAt: new Date(),
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
 * `auth.api.deletePermission`
 *
 * **client:**
 * `authClient.rbac.deletePermission`
 */
export const deletePermission = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/delete-permission",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        id: z.string().meta({
          description: "The id of the permission to delete.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.deletePermission",
          summary: "Delete a permission",
          description: "Delete a permission",
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
                      },
                      message: {
                        type: "string",
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
                      },
                      error: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.PERMISSION_NOT_FOUND],
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
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.PERMISSION_NOT_FOUND,
        })
      }

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
 * `auth.api.getPermissionsOptions`
 *
 * **client:**
 * `authClient.rbac.getPermissionsOptions`
 */
export const getPermissionsOptions = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/get-permissions-options",
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
            description: "Filter to return only active permissions. Defaults to true.",
          }),
        search: z.string().optional().meta({
          description: "Search term to filter permissions by name.",
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
          operationId: "rbac.getPermissionsOptions",
          summary: "Get permissions as select options",
          description:
            "Get permissions formatted as value/label pairs for select components. Supports search and limit parameters.",
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
                        items: {
                          type: "object",
                          required: ["value", "label"],
                          properties: {
                            value: {
                              type: "string",
                              description: "Permission ID",
                            },
                            label: {
                              type: "string",
                              description: "Permission name",
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
                            value: "perm_123abc",
                            label: "users:read",
                          },
                          {
                            value: "perm_456def",
                            label: "users:write",
                          },
                          {
                            value: "perm_789ghi",
                            label: "users:delete",
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
                            value: "perm_123abc",
                            label: "users:read",
                          },
                          {
                            value: "perm_456def",
                            label: "users:write",
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

      try {
        const permissions = await ctx.context.adapter.findMany<Permission>({
          model: "permission",
          where: where.length ? where : undefined,
          sortBy: {
            field: "name",
            direction: "asc",
          },
        })

        // Filter by search term if provided
        let filteredPermissions = permissions
        if (ctx.query?.search) {
          const searchLower = ctx.query.search.toLowerCase()
          filteredPermissions = permissions.filter((permission) =>
            permission.name.toLowerCase().includes(searchLower),
          )
        }

        // Apply limit if provided
        if (ctx.query?.limit && ctx.query.limit > 0) {
          filteredPermissions = filteredPermissions.slice(0, ctx.query.limit)
        }

        const options = filteredPermissions.map((permission) => ({
          value: permission.id,
          label: permission.name,
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
 * `auth.api.getPermissionRoles`
 *
 * **client:**
 * `authClient.rbac.getPermissionRoles`
 */
export const getPermissionRoles = <O extends RBACPluginOptions>(options: O) => {
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
        })
        .refine((data) => data.permissionId || data.permissionKey, {
          message: "Either permissionId or permissionKey is required.",
        }),
      metadata: {
        openapi: {
          operationId: "rbac.getPermissionRoles",
          summary: "Get all roles that include a specific permission",
          description:
            "Returns all roles associated with a given permission, identified by its ID or key, with pagination, search and sorting support.",
          responses: {
            200: {
              description: "List of roles that include the given permission",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      permission: {
                        $ref: "#/components/schemas/Permission",
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
              description: "Permission not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["PERMISSION_NOT_FOUND"],
                      },
                      error: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.PERMISSION_NOT_FOUND],
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
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.PERMISSION_NOT_FOUND,
        })
      }

      // Get all role-permission mappings that reference this permission
      const rolePermissions = await ctx.context.adapter.findMany<RolePermission>({
        model: "rolePermission",
        where: [{ field: "permissionId", value: permission.id }],
      })

      // Extract role IDs
      const roleIds = rolePermissions.map((rp) => rp.roleId)

      // If there are no roles, return empty result
      if (roleIds.length === 0) {
        return ctx.json({
          permission,
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
          permission,
          roles,
          total,
          limit: Number(ctx.query?.limit),
          offset: Number(ctx.query?.offset),
        })
      } catch {
        return ctx.json({
          permission,
          roles: [],
          total: 0,
          limit: Number(ctx.query?.limit),
          offset: Number(ctx.query?.offset),
        })
      }
    },
  )
}
