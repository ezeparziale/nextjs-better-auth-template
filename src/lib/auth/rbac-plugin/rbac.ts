import type { BetterAuthPlugin, Session, Where } from "better-auth"
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api"
import { UserWithRole } from "better-auth/plugins/admin"
import * as z from "zod"
import { RBAC_ERROR_CODES } from "./error-codes"
import { schema } from "./schema"
import { seedRBACData } from "./seed"
import {
  Permission,
  RBACPluginOptions,
  Role,
  RolePermission,
  User,
  UserRole,
} from "./types"
import { getPaginationParams } from "./utils"
import { validateKey } from "./validation"

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
    ...options,
  }

  const validationOptions = {
    permission: {
      minLength: opts.minPermissionKeyLength,
      maxLength: opts.maxPermissionKeyLength,
      pattern: opts.permissionKeyPattern,
      errorMessage: opts.permissionKeyErrorMessage,
    },
    role: {
      minLength: opts.minRoleKeyLength,
      maxLength: opts.maxRoleKeyLength,
      pattern: opts.roleKeyPattern,
      errorMessage: opts.roleKeyErrorMessage,
    },
  }

  const paginationConfig = {
    defaultLimit: opts.defaultLimit,
    maxLimit: opts.maxLimit,
    defaultOffset: opts.defaultOffset,
  }

  /**
   * Ensures a valid session, if not will throw.
   * Will also provide additional types on the user to include role types.
   */
  const rbacMiddleware = createAuthMiddleware(async (ctx) => {
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
  return {
    id: "rbac",
    schema: schema,
    hooks: {
      after: [],
    },
    endpoints: {
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
      listPermissions: createAuthEndpoint(
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
              .default(opts.defaultLimit),
            offset: z
              .string()
              .meta({
                description: "The offset to start from.",
              })
              .or(z.number())
              .optional()
              .default(opts.defaultOffset),
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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
      ),
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
      getPermission: createAuthEndpoint(
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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
      ),
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
      createPermission: createAuthEndpoint(
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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
      ),
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
      updatePermission: createAuthEndpoint(
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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
            },
          })

          // Update role assignments if provided (incremental update)
          if (ctx.body.roleIds !== undefined) {
            // Get current role assignments
            const currentAssignments =
              await ctx.context.adapter.findMany<RolePermission>({
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
            const toDelete = currentAssignments.filter(
              (rp) => !newRoleIds.has(rp.roleId),
            )

            // Find assignments to add (exist in new but not in current)
            const toAdd = ctx.body.roleIds.filter(
              (roleId) => !currentRoleIds.has(roleId),
            )

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
      ),
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
      deletePermission: createAuthEndpoint(
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
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
      ),
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
      listRoles: createAuthEndpoint(
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
              .default(opts.defaultLimit),
            offset: z
              .string()
              .meta({
                description: "The offset to start from.",
              })
              .or(z.number())
              .optional()
              .default(opts.defaultOffset),
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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
      ),
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
      getRole: createAuthEndpoint(
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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
      ),
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
      createRole: createAuthEndpoint(
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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
      ),
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
      updateRole: createAuthEndpoint(
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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
            },
          })

          // Update permissions if provided (incremental update)
          if (ctx.body.permissionIds !== undefined) {
            // Get current permissions
            const currentPermissions =
              await ctx.context.adapter.findMany<RolePermission>({
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
      ),
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
      deleteRole: createAuthEndpoint(
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
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
      ),
      /**
       * ### Endpoint
       *
       * POST `/rbac/assign-permission-to-role`
       *
       * ### API Methods
       *
       * **server:**
       * `auth.api.assignPermissionToRole`
       *
       * **client:**
       * `authClient.rbac.assignPermissionToRole`
       */
      assignPermissionToRole: createAuthEndpoint(
        "/rbac/assign-permission-to-role",
        {
          method: "POST",
          use: [rbacMiddleware],
          body: z.object({
            roleId: z.string().meta({
              description: "The id of the role.",
            }),
            permissionId: z.string().meta({
              description: "The id of the permission to assign.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "rbac.assignPermissionToRole",
              summary: "Assign a permission to a role",
              description: "Assign a permission to a role",
              responses: {
                200: {
                  description: "Permission assigned successfully",
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
                            enum: [
                              "Permission already assigned to role",
                              "Permission assigned to role successfully",
                            ],
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
                          },
                          error: {
                            type: "string",
                            enum: [
                              RBAC_ERROR_CODES.ROLE_NOT_FOUND,
                              RBAC_ERROR_CODES.PERMISSION_NOT_FOUND,
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

          // Check if role exists
          const role = await ctx.context.adapter.findOne<Role>({
            model: "role",
            where: [
              {
                field: "id",
                value: ctx.body.roleId,
              },
            ],
          })

          if (!role) {
            throw new APIError("NOT_FOUND", {
              message: RBAC_ERROR_CODES.ROLE_NOT_FOUND,
            })
          }

          // Check if permission exists
          const permission = await ctx.context.adapter.findOne<Permission>({
            model: "permission",
            where: [
              {
                field: "id",
                value: ctx.body.permissionId,
              },
            ],
          })

          if (!permission) {
            throw new APIError("NOT_FOUND", {
              message: RBAC_ERROR_CODES.PERMISSION_NOT_FOUND,
            })
          }

          // Check if assignment already exists
          const existingAssignment = await ctx.context.adapter.findOne<RolePermission>({
            model: "rolePermission",
            where: [
              {
                field: "roleId",
                value: ctx.body.roleId,
              },
              {
                field: "permissionId",
                value: ctx.body.permissionId,
              },
            ],
          })

          if (existingAssignment) {
            return ctx.json({
              success: true,
              message: "Permission already assigned to role",
            })
          }

          // Create assignment
          await ctx.context.adapter.create<RolePermission>({
            model: "rolePermission",
            data: {
              roleId: ctx.body.roleId,
              permissionId: ctx.body.permissionId,
              createdAt: new Date(),
            },
          })

          return ctx.json({
            success: true,
            message: "Permission assigned to role successfully",
          })
        },
      ),
      /**
       * ### Endpoint
       *
       * POST `/rbac/remove-permission-from-role`
       *
       * ### API Methods
       *
       * **server:**
       * `auth.api.removePermissionFromRole`
       *
       * **client:**
       * `authClient.rbac.removePermissionFromRole`
       */
      removePermissionFromRole: createAuthEndpoint(
        "/rbac/remove-permission-from-role",
        {
          method: "POST",
          use: [rbacMiddleware],
          body: z.object({
            roleId: z.string().meta({
              description: "The id of the role.",
            }),
            permissionId: z.string().meta({
              description: "The id of the permission to remove.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "rbac.removePermissionFromRole",
              summary: "Remove a permission from a role",
              description: "Remove a permission from a role",
              responses: {
                200: {
                  description: "Permission removed successfully",
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
                            enum: ["Permission removed from role successfully"],
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

          // Delete assignment
          await ctx.context.adapter.delete<RolePermission>({
            model: "rolePermission",
            where: [
              {
                field: "roleId",
                value: ctx.body.roleId,
              },
              {
                field: "permissionId",
                value: ctx.body.permissionId,
              },
            ],
          })

          return ctx.json({
            success: true,
            message: "Permission removed from role successfully",
          })
        },
      ),
      /**
       * ### Endpoint
       *
       * POST `/rbac/assign-role-to-user`
       *
       * ### API Methods
       *
       * **server:**
       * `auth.api.assignRoleToUser`
       *
       * **client:**
       * `authClient.rbac.assignRoleToUser`
       */
      assignRoleToUser: createAuthEndpoint(
        "/rbac/assign-role-to-user",
        {
          method: "POST",
          use: [rbacMiddleware],
          body: z.object({
            userId: z.string().meta({
              description: "The id of the user.",
            }),
            roleId: z.string().meta({
              description: "The id of the role to assign.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "rbac.assignRoleToUser",
              summary: "Assign a role to a user",
              description: "Assign a role to a user",
              responses: {
                200: {
                  description: "Role assigned successfully",
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
                            enum: [
                              "Role already assigned to user",
                              "Role assigned to user successfully",
                            ],
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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

          // Check if role exists
          const role = await ctx.context.adapter.findOne<Role>({
            model: "role",
            where: [
              {
                field: "id",
                value: ctx.body.roleId,
              },
            ],
          })

          if (!role) {
            throw new APIError("NOT_FOUND", {
              message: RBAC_ERROR_CODES.ROLE_NOT_FOUND,
            })
          }

          // Check if assignment already exists
          const existingAssignment = await ctx.context.adapter.findOne<UserRole>({
            model: "userRole",
            where: [
              {
                field: "userId",
                value: ctx.body.userId,
              },
              {
                field: "roleId",
                value: ctx.body.roleId,
              },
            ],
          })

          if (existingAssignment) {
            return ctx.json({
              success: true,
              message: "Role already assigned to user",
            })
          }

          // Create assignment
          await ctx.context.adapter.create<UserRole>({
            model: "userRole",
            data: {
              userId: ctx.body.userId,
              roleId: ctx.body.roleId,
              createdAt: new Date(),
            },
          })

          return ctx.json({
            success: true,
            message: "Role assigned to user successfully",
          })
        },
      ),
      /**
       * ### Endpoint
       *
       * POST `/rbac/remove-role-from-user`
       *
       * ### API Methods
       *
       * **server:**
       * `auth.api.removeRoleFromUser`
       *
       * **client:**
       * `authClient.rbac.removeRoleFromUser`
       */
      removeRoleFromUser: createAuthEndpoint(
        "/rbac/remove-role-from-user",
        {
          method: "POST",
          use: [rbacMiddleware],
          body: z.object({
            userId: z.string().meta({
              description: "The id of the user.",
            }),
            roleId: z.string().meta({
              description: "The id of the role to remove.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "rbac.removeRoleFromUser",
              summary: "Remove a role from a user",
              description: "Remove a role from a user",
              responses: {
                200: {
                  description: "Role removed successfully",
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
                            enum: ["Role removed from user successfully"],
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

          // Delete assignment
          await ctx.context.adapter.delete<UserRole>({
            model: "userRole",
            where: [
              {
                field: "userId",
                value: ctx.body.userId,
              },
              {
                field: "roleId",
                value: ctx.body.roleId,
              },
            ],
          })

          return ctx.json({
            success: true,
            message: "Role removed from user successfully",
          })
        },
      ),
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
      getPermissionRoles: createAuthEndpoint(
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
            })
            .refine((data) => data.permissionId || data.permissionKey, {
              message: "Either permissionId or permissionKey is required.",
            }),
          metadata: {
            openapi: {
              operationId: "rbac.getPermissionRoles",
              summary: "Get all roles that include a specific permission",
              description:
                "Returns all roles associated with a given permission, identified by its ID or key.",
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

          // Retrieve the actual roles associated with the permission
          const roles = (
            await Promise.all(
              rolePermissions.map((rp) =>
                ctx.context.adapter.findOne<Role>({
                  model: "role",
                  where: [{ field: "id", value: rp.roleId }],
                }),
              ),
            )
          ).filter((role): role is Role => role !== null)

          // Return the permission and the list of associated roles
          return ctx.json({
            permission,
            roles: roles.filter(Boolean),
          })
        },
      ),
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
      getRolePermissions: createAuthEndpoint(
        "/rbac/get-role-permissions",
        {
          method: "GET",
          use: [rbacMiddleware],
          query: z.object({
            roleId: z.string().meta({
              description: "The id of the role.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "rbac.getRolePermissions",
              summary: "Get all permissions for a role",
              description: "Get all permissions for a role",
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

          // Check if role exists
          const role = await ctx.context.adapter.findOne<Role>({
            model: "role",
            where: [
              {
                field: "id",
                value: ctx.query.roleId,
              },
            ],
          })

          if (!role) {
            throw new APIError("NOT_FOUND", {
              message: RBAC_ERROR_CODES.ROLE_NOT_FOUND,
            })
          }

          // Get role permissions
          const rolePermissions = await ctx.context.adapter.findMany<RolePermission>({
            model: "rolePermission",
            where: [
              {
                field: "roleId",
                value: ctx.query.roleId,
              },
            ],
          })

          // Get permission details
          const permissions = (
            await Promise.all(
              rolePermissions.map(async (rp) => {
                return await ctx.context.adapter.findOne<Permission>({
                  model: "permission",
                  where: [
                    {
                      field: "id",
                      value: rp.permissionId,
                    },
                  ],
                })
              }),
            )
          ).filter((permission): permission is Permission => permission !== null)

          return ctx.json({
            role,
            permissions: permissions.filter(Boolean),
          })
        },
      ),
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
      getUserRoles: createAuthEndpoint(
        "/rbac/get-user-roles",
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
              operationId: "rbac.getUserRoles",
              summary: "Get all roles for a user",
              description: "Get all roles for a user",
              responses: {
                200: {
                  description: "User roles",
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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

          // Get role details
          const roles = await Promise.all(
            userRoles.map(async (ur) => {
              return await ctx.context.adapter.findOne<Role>({
                model: "role",
                where: [
                  {
                    field: "id",
                    value: ur.roleId,
                  },
                ],
              })
            }),
          )

          return ctx.json({
            roles: roles.filter(Boolean),
          })
        },
      ),
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
      getUserPermissions: createAuthEndpoint(
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
              description:
                "Get all permissions for a user through their assigned roles",
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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
      ),
      /**
       * ### Endpoint
       *
       * POST `/rbac/check-permission`
       *
       * ### API Methods
       *
       * **server:**
       * `auth.api.checkPermission`
       *
       * **client:**
       * `authClient.rbac.checkPermission`
       */
      checkPermission: createAuthEndpoint(
        "/rbac/check-permission",
        {
          method: "POST",
          use: [rbacMiddleware],
          body: z.object({
            userId: z.string().meta({
              description: "The id of the user.",
            }),
            permissionKey: z.string().meta({
              description: "The key of the permission to check.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "rbac.checkPermission",
              summary: "Check if a user has a specific permission",
              description:
                "Check if a user has a specific permission through their roles",
              responses: {
                200: {
                  description: "Permission check result",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          hasPermission: {
                            type: "boolean",
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

          // Get the permission by key
          const permission = await ctx.context.adapter.findOne<Permission>({
            model: "permission",
            where: [
              {
                field: "key",
                value: ctx.body.permissionKey,
              },
            ],
          })

          if (!permission) {
            return ctx.json({
              hasPermission: false,
            })
          }

          // Get user roles
          const userRoles = await ctx.context.adapter.findMany<UserRole>({
            model: "userRole",
            where: [
              {
                field: "userId",
                value: ctx.body.userId,
              },
            ],
          })

          // Check if any role has the permission
          for (const userRole of userRoles) {
            const rolePermission = await ctx.context.adapter.findOne<RolePermission>({
              model: "rolePermission",
              where: [
                {
                  field: "roleId",
                  value: userRole.roleId,
                },
                {
                  field: "permissionId",
                  value: permission.id,
                },
              ],
            })

            if (rolePermission) {
              return ctx.json({
                hasPermission: true,
              })
            }
          }

          return ctx.json({
            hasPermission: false,
          })
        },
      ),
      /**
       * ### Endpoint
       *
       * POST `/rbac/has-permission`
       *
       * ### API Methods
       *
       * **server:**
       * `auth.api.hasPermission`
       *
       * **client:**
       * `authClient.rbac.hasPermission`
       */
      hasPermission: createAuthEndpoint(
        "/rbac/has-permission",
        {
          method: "POST",
          use: [rbacMiddleware],
          body: z.object({
            permissionKey: z.string().meta({
              description: "The key of the permission to check.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "rbac.hasPermission",
              summary: "Check if the current user has a specific permission",
              description:
                "Check if the authenticated user has a specific permission through their roles",
              responses: {
                200: {
                  description: "Permission check result",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          hasPermission: {
                            type: "boolean",
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
          const session = ctx.context.session

          // Get the permission by key
          const permission = await ctx.context.adapter.findOne<Permission>({
            model: "permission",
            where: [
              {
                field: "key",
                value: ctx.body.permissionKey,
              },
            ],
          })

          if (!permission) {
            return ctx.json({
              hasPermission: false,
            })
          }

          // Get current user's roles
          const userRoles = await ctx.context.adapter.findMany<UserRole>({
            model: "userRole",
            where: [
              {
                field: "userId",
                value: session.user.id,
              },
            ],
          })

          // Check if any role has the permission
          for (const userRole of userRoles) {
            const rolePermission = await ctx.context.adapter.findOne<RolePermission>({
              model: "rolePermission",
              where: [
                {
                  field: "roleId",
                  value: userRole.roleId,
                },
                {
                  field: "permissionId",
                  value: permission.id,
                },
              ],
            })

            if (rolePermission) {
              return ctx.json({
                hasPermission: true,
              })
            }
          }

          return ctx.json({
            hasPermission: false,
          })
        },
      ),
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
      getPermissionsOptions: createAuthEndpoint(
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
                description:
                  "Filter to return only active permissions. Defaults to true.",
              }),
          }),
          metadata: {
            openapi: {
              operationId: "rbac.getPermissionsOptions",
              summary: "Get permissions as select options",
              description:
                "Get permissions formatted as value/label pairs for select components",
              responses: {
                200: {
                  description: "Permissions options",
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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

            const options = permissions.map((permission) => ({
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
      ),
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
      getRolesOptions: createAuthEndpoint(
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
              description:
                "Get roles formatted as value/label pairs for select components",
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
          const session = ctx.context.session

          if (session.user.role != "admin") {
            throw new APIError("FORBIDDEN")
          }

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
      ),
    },
    $ERROR_CODES: RBAC_ERROR_CODES,
    options,
    async init(ctx) {
      // Seed RBAC data if options are provided
      if (opts && (opts.seedPermissions || opts.seedRoles)) {
        await seedRBACData(ctx, opts, validationOptions)
      }
    },
  } satisfies BetterAuthPlugin
}
