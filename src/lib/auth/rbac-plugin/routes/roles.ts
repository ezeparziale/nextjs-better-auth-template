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
 * GET `/rbac/list-roles`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.listRoles`
 *
 * **client:**
 * `authClient.rbac.listRoles`
 */
export const listRoles = <O extends RBACPluginOptions>(options: O) => {
  const paginationConfig = createPaginationConfig(options)

  return createAuthEndpoint(
    "/rbac/list-roles",
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
          operationId: "rbac.listRoles",
          summary: "List roles",
          description: "List roles",
          responses: {
            200: {
              description: "List roles",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
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
          },
        },
      },
    },
    async (ctx) => {
      if (options.disabledEndpoints?.includes("listRoles")) {
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

        const total = await ctx.context.adapter.count({
          model: "role",
          where: where.length ? where : undefined,
        })

        return ctx.json({
          roles,
          total,
          limit: Number(ctx.query?.limit),
          offset: Number(ctx.query?.offset),
        })
      } catch {
        return ctx.json({
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
 * GET `/rbac/get-role`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.getRole`
 *
 * **client:**
 * `authClient.rbac.getRole`
 */
export const getRole = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/get-role",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z.object({
        id: z.string().meta({
          description: "The id of the role.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.getRole",
          summary: "Get an existing role",
          description: "Get an existing role",
          responses: {
            200: {
              description: "Role",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      role: {
                        $ref: "#/components/schemas/Role",
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
      if (options.disabledEndpoints?.includes("getRole")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      const role = await ctx.context.adapter.findOne<Role>({
        model: "role",
        where: [
          {
            field: "id",
            value: ctx.query.id,
          },
        ],
      })

      if (!role) {
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.ROLE_NOT_FOUND,
        })
      }

      return ctx.json({
        role,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/create-role`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.createRole`
 *
 * **client:**
 * `authClient.rbac.createRole`
 */
export const createRole = <O extends RBACPluginOptions>(options: O) => {
  const validationOptions = createValidationOptions(options)

  return createAuthEndpoint(
    "/rbac/create-role",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        name: z.string().meta({
          description: "The name of the role.",
        }),
        key: z.string().meta({
          description: "The unique key for the role.",
        }),
        description: z.string().optional().meta({
          description: "Optional description of the role.",
        }),
        permissionIds: z.array(z.string()).optional().meta({
          description: "Optional array of permission IDs to assign to the role.",
        }),
        isActive: z.boolean().optional().meta({
          description:
            "Optional flag to set permission active status. Defaults to true.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.createRole",
          summary: "Create a new role",
          description: "Create a new role",
          responses: {
            200: {
              description: "Role created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      role: {
                        $ref: "#/components/schemas/Role",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Role already exists",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["ROLE_ALREADY_EXISTS"],
                      },
                      error: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_ALREADY_EXISTS],
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
      if (options.disabledEndpoints?.includes("createRole")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      validateKey("role", ctx.body.key, validationOptions)

      // Check if role with the same key already exists
      const existingRole = await ctx.context.adapter.findOne<Role>({
        model: "role",
        where: [
          {
            field: "key",
            value: ctx.body.key,
          },
        ],
      })

      if (existingRole) {
        throw new APIError("BAD_REQUEST", {
          message: RBAC_ERROR_CODES.ROLE_ALREADY_EXISTS,
        })
      }

      // If permissionIds provided, validate they exist
      if (ctx.body.permissionIds && ctx.body.permissionIds.length > 0) {
        for (const permissionId of ctx.body.permissionIds) {
          const permission = await ctx.context.adapter.findOne<Permission>({
            model: "permission",
            where: [
              {
                field: "id",
                value: permissionId,
              },
            ],
          })

          if (!permission) {
            throw new APIError("NOT_FOUND", {
              message: `Permission with id ${permissionId} not found`,
            })
          }
        }
      }

      const role = await ctx.context.adapter.create<Role>({
        model: "role",
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

      // Assign permissions if provided (in parallel for better performance)
      if (ctx.body.permissionIds && ctx.body.permissionIds.length > 0) {
        await Promise.all(
          ctx.body.permissionIds.map((permissionId) =>
            ctx.context.adapter.create<RolePermission>({
              model: "rolePermission",
              data: {
                roleId: role.id,
                permissionId: permissionId,
                createdAt: new Date(),
              },
            }),
          ),
        )
      }

      return ctx.json({
        role,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/update-role`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.updateRole`
 *
 * **client:**
 * `authClient.rbac.updateRole`
 */
export const updateRole = <O extends RBACPluginOptions>(options: O) => {
  const validationOptions = createValidationOptions(options)

  return createAuthEndpoint(
    "/rbac/update-role",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        id: z.string().meta({
          description: "The id of the role to update.",
        }),
        name: z.string().optional().meta({
          description: "The new name of the role.",
        }),
        key: z.string().optional().meta({
          description: "The new key for the role.",
        }),
        description: z.string().optional().meta({
          description: "The new description of the role.",
        }),
        isActive: z.boolean().optional().meta({
          description: "Optional flag to set permission active status.",
        }),
        permissionIds: z.array(z.string()).optional().meta({
          description:
            "Optional array of permission IDs to replace current permissions.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.updateRole",
          summary: "Update an existing role",
          description: "Update an existing role",
          responses: {
            200: {
              description: "Role updated successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      role: {
                        $ref: "#/components/schemas/Role",
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
            400: {
              description: "Role key already exists",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["ROLE_ALREADY_EXISTS", "PERMISSION_NOT_FOUND"],
                      },
                      error: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.ROLE_ALREADY_EXISTS,
                          "Permission with id ${permissionId} not found",
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
      if (options.disabledEndpoints?.includes("updateRole")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      if (ctx.body.key) {
        validateKey("role", ctx.body.key, validationOptions)
      }

      // Check if role exists
      const existingRole = await ctx.context.adapter.findOne<Role>({
        model: "role",
        where: [
          {
            field: "id",
            value: ctx.body.id,
          },
        ],
      })

      if (!existingRole) {
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.ROLE_NOT_FOUND,
        })
      }

      // If updating key, check if new key already exists
      if (ctx.body.key && ctx.body.key !== existingRole.key) {
        const duplicateRole = await ctx.context.adapter.findOne<Role>({
          model: "role",
          where: [
            {
              field: "key",
              value: ctx.body.key,
            },
          ],
        })

        if (duplicateRole) {
          throw new APIError("BAD_REQUEST", {
            message: RBAC_ERROR_CODES.ROLE_ALREADY_EXISTS,
          })
        }
      }

      // If permissionIds provided, validate they exist
      if (ctx.body.permissionIds) {
        for (const permissionId of ctx.body.permissionIds) {
          const permission = await ctx.context.adapter.findOne<Permission>({
            model: "permission",
            where: [
              {
                field: "id",
                value: permissionId,
              },
            ],
          })

          if (!permission) {
            throw new APIError("NOT_FOUND", {
              message: `Permission with id ${permissionId} not found`,
            })
          }
        }
      }

      // Update role
      const updatedRole = await ctx.context.adapter.update<Role>({
        model: "role",
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

      // Update permissions if provided (incremental update)
      if (ctx.body.permissionIds !== undefined) {
        // Get current permissions
        const currentPermissions = await ctx.context.adapter.findMany<RolePermission>({
          model: "rolePermission",
          where: [
            {
              field: "roleId",
              value: ctx.body.id,
            },
          ],
        })

        const currentPermissionIds = new Set(
          currentPermissions.map((rp) => rp.permissionId),
        )
        const newPermissionIds = new Set(ctx.body.permissionIds)

        // Find permissions to delete (exist in current but not in new)
        const toDelete = currentPermissions.filter(
          (rp) => !newPermissionIds.has(rp.permissionId),
        )

        // Find permissions to add (exist in new but not in current)
        const toAdd = ctx.body.permissionIds.filter(
          (permissionId) => !currentPermissionIds.has(permissionId),
        )

        // Delete removed permissions in parallel
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

        // Create new permissions in parallel
        if (toAdd.length > 0) {
          await Promise.all(
            toAdd.map((permissionId) =>
              ctx.context.adapter.create<RolePermission>({
                model: "rolePermission",
                data: {
                  roleId: ctx.body.id,
                  permissionId: permissionId,
                  createdAt: new Date(),
                },
              }),
            ),
          )
        }
      }

      return ctx.json({
        role: updatedRole,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/delete-role`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.deleteRole`
 *
 * **client:**
 * `authClient.rbac.deleteRole`
 */
export const deleteRole = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/delete-role",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        id: z.string().meta({
          description: "The id of the role to delete.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.deleteRole",
          summary: "Delete a role",
          description: "Delete a role",
          responses: {
            200: {
              description: "Role deleted successfully",
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
      if (options.disabledEndpoints?.includes("deleteRole")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Check if role exists
      const existingRole = await ctx.context.adapter.findOne<Role>({
        model: "role",
        where: [
          {
            field: "id",
            value: ctx.body.id,
          },
        ],
      })

      if (!existingRole) {
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.ROLE_NOT_FOUND,
        })
      }

      // Delete role
      await ctx.context.adapter.delete<Role>({
        model: "role",
        where: [
          {
            field: "id",
            value: ctx.body.id,
          },
        ],
      })

      return ctx.json({
        success: true,
        message: "Role deleted successfully",
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * GET `/rbac/get-roles-options`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.getRolesOptions`
 *
 * **client:**
 * `authClient.rbac.getRolesOptions`
 */
export const getRolesOptions = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/get-roles-options",
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
            description: "Filter to return only active roles. Defaults to true.",
          }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.getRolesOptions",
          summary: "Get roles as select options",
          description: "Get roles formatted as value/label pairs for select components",
          responses: {
            200: {
              description: "Roles options",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      options: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            value: {
                              type: "string",
                            },
                            label: {
                              type: "string",
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
      if (options.disabledEndpoints?.includes("getRolesOptions")) {
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
        const roles = await ctx.context.adapter.findMany<Role>({
          model: "role",
          where: where.length ? where : undefined,
          sortBy: {
            field: "name",
            direction: "asc",
          },
        })

        const options = roles.map((role) => ({
          value: role.id,
          label: role.name,
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
 * GET `/rbac/get-role-permissions`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.getRolePermissions`
 *
 * **client:**
 * `authClient.rbac.getRolePermissions`
 */
export const getRolePermissions = <O extends RBACPluginOptions>(options: O) => {
  const paginationConfig = createPaginationConfig(options)

  return createAuthEndpoint(
    "/rbac/get-role-permissions",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z
        .object({
          roleId: z.string().optional().meta({
            description: "The ID of the role.",
          }),
          roleKey: z.string().optional().meta({
            description: "The key of the role.",
          }),
          searchValue: z.string().optional().meta({
            description: "The value to search in permissions.",
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
        })
        .refine((data) => data.roleId || data.roleKey, {
          message: "Either roleId or roleKey is required.",
        }),
      metadata: {
        openapi: {
          operationId: "rbac.getRolePermissions",
          summary: "Get all permissions for a role",
          description:
            "Get all permissions for a role with pagination, search and sorting support",
          responses: {
            200: {
              description: "Role permissions",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      role: {
                        $ref: "#/components/schemas/Role",
                      },
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
      if (options.disabledEndpoints?.includes("getRolePermissions")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      const { roleId, roleKey } = ctx.query

      let role: Role | null = null

      // Look up the role by ID or key
      if (roleId) {
        role = await ctx.context.adapter.findOne<Role>({
          model: "role",
          where: [{ field: "id", value: roleId }],
        })
      } else if (roleKey) {
        role = await ctx.context.adapter.findOne<Role>({
          model: "role",
          where: [{ field: "key", value: roleKey }],
        })
      }

      // If the role does not exist, return a 404 error
      if (!role) {
        throw new APIError("NOT_FOUND", {
          message: RBAC_ERROR_CODES.ROLE_NOT_FOUND,
        })
      }

      // Get all role-permission mappings for this role
      const rolePermissions = await ctx.context.adapter.findMany<RolePermission>({
        model: "rolePermission",
        where: [{ field: "roleId", value: role.id }],
      })

      // Extract permission IDs
      const permissionIds = rolePermissions.map((rp) => rp.permissionId)

      // If there are no permissions, return empty result
      if (permissionIds.length === 0) {
        return ctx.json({
          role,
          permissions: [],
          total: 0,
          limit: Number(ctx.query?.limit),
          offset: Number(ctx.query?.offset),
        })
      }

      // Build where clause for permissions
      const where: Where[] = [
        {
          field: "id",
          operator: "in",
          value: permissionIds,
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
          role,
          permissions,
          total,
          limit: Number(ctx.query?.limit),
          offset: Number(ctx.query?.offset),
        })
      } catch {
        return ctx.json({
          role,
          permissions: [],
          total: 0,
          limit: Number(ctx.query?.limit),
          offset: Number(ctx.query?.offset),
        })
      }
    },
  )
}
