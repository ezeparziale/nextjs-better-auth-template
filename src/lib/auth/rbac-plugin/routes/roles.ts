import type { Where } from "better-auth"
import { APIError, createAuthEndpoint } from "better-auth/api"
import * as z from "zod"
import { parseFiltersParam } from "../../shared/filters"
import {
  createPaginationConfig,
  createValidationOptions,
  ensureUserIsAdmin,
  rbacMiddleware,
} from "../call"
import { RBAC_ERROR_CODES } from "../error-codes"
import type {
  Permission,
  RBACPluginOptions,
  Role,
  RolePermission,
  User,
  UserRole,
} from "../types"
import { dedupeIds, findMissingIds, getPaginationParams } from "../utils"
import { validateKey } from "../validation"
import { sortByPermission, sortByRole, sortByUser } from "./sort-schemas"

/**
 * ### Endpoint
 *
 * GET `/rbac/list-roles`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacListRoles`
 *
 * **client:**
 * `authClient.rbac.listRoles`
 */
export const rbacListRoles = <O extends RBACPluginOptions>(options: O) => {
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
        sortBy: sortByRole,
        sortDirection: z
          .enum(["asc", "desc"])
          .meta({
            description: "The direction to sort by.",
          })
          .optional(),
        filters: z
          .string()
          .meta({
            description: "A JSON string representing an array of filters.",
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

      if (ctx.query?.filters) {
        where.push(...parseFiltersParam(ctx.query.filters))
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
          limit,
          offset,
        })
      } catch {
        return ctx.json({
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
 * GET `/rbac/get-role`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacGetRole`
 *
 * **client:**
 * `authClient.rbac.getRole`
 */
export const rbacGetRole = <O extends RBACPluginOptions>(options: O) => {
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
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_NOT_FOUND.message],
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
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
 * `auth.api.rbacCreateRole`
 *
 * **client:**
 * `authClient.rbac.createRole`
 */
export const rbacCreateRole = <O extends RBACPluginOptions>(options: O) => {
  const validationOptions = createValidationOptions(options)

  return createAuthEndpoint(
    "/rbac/create-role",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        name: z.string().trim().min(1).meta({
          description: "The name of the role.",
        }),
        key: z.string().trim().min(1).meta({
          description: "The unique key for the role.",
        }),
        description: z.string().trim().min(1).meta({
          description: "The description of the role.",
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
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_ALREADY_EXISTS.message],
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

      const key = validateKey("role", ctx.body.key, validationOptions)

      // Check if role with the same key already exists
      const existingRole = await ctx.context.adapter.findOne<Role>({
        model: "role",
        where: [
          {
            field: "key",
            value: key,
          },
        ],
      })

      if (existingRole) {
        throw APIError.from("BAD_REQUEST", RBAC_ERROR_CODES.ROLE_ALREADY_EXISTS)
      }

      // Dedupe permission ids to avoid duplicate assignments
      const permissionIds = ctx.body.permissionIds
        ? dedupeIds(ctx.body.permissionIds)
        : undefined

      // If permissionIds provided, validate they exist (single batched query)
      if (permissionIds && permissionIds.length > 0) {
        const missingPermissionIds = await findMissingIds(
          ctx.context.adapter,
          "permission",
          permissionIds,
        )

        if (missingPermissionIds.length > 0) {
          throw new APIError("NOT_FOUND", {
            message: `Permission with id ${missingPermissionIds[0]} not found`,
          })
        }
      }

      const role = await ctx.context.adapter.create<Role>({
        model: "role",
        data: {
          name: ctx.body.name,
          key,
          description: ctx.body.description,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: ctx.body.isActive ?? true,
          createdBy: session.user.email,
          updatedBy: session.user.email,
        },
      })

      // Assign permissions if provided (in parallel for better performance)
      if (permissionIds && permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map((permissionId) =>
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
 * POST `/rbac/clone-role`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacCloneRole`
 *
 * **client:**
 * `authClient.rbac.cloneRole`
 */
export const rbacCloneRole = <O extends RBACPluginOptions>(options: O) => {
  const validationOptions = createValidationOptions(options)

  return createAuthEndpoint(
    "/rbac/clone-role",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        id: z.string().meta({
          description: "The id of the role to clone.",
        }),
        name: z.string().meta({
          description: "The name of the cloned role.",
        }),
        key: z.string().meta({
          description: "The unique key for the cloned role.",
        }),
        description: z.string().optional().meta({
          description: "Optional description of the cloned role.",
        }),
        isActive: z.boolean().optional().meta({
          description:
            "Optional flag to set role active status. Defaults to the source role value.",
        }),
        copyPermissions: z.boolean().optional().default(true).meta({
          description:
            "Whether to copy the permissions from the source role. Defaults to true.",
        }),
        copyUsers: z.boolean().optional().default(true).meta({
          description:
            "Whether to copy the user assignments from the source role. Defaults to true.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.cloneRole",
          summary: "Clone an existing role",
          description:
            "Create a copy of an existing role, optionally copying its permissions.",
          responses: {
            200: {
              description: "Role cloned successfully",
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
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_NOT_FOUND.message],
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
                        enum: ["ROLE_ALREADY_EXISTS"],
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_ALREADY_EXISTS.message],
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
      if (options.disabledEndpoints?.includes("cloneRole")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Find the source role
      const sourceRole = await ctx.context.adapter.findOne<Role>({
        model: "role",
        where: [
          {
            field: "id",
            value: ctx.body.id,
          },
        ],
      })

      if (!sourceRole) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      // Validate the new role key
      const key = validateKey("role", ctx.body.key, validationOptions)

      // Check if a role with the same key already exists
      const existingRole = await ctx.context.adapter.findOne<Role>({
        model: "role",
        where: [
          {
            field: "key",
            value: key,
          },
        ],
      })

      if (existingRole) {
        throw APIError.from("BAD_REQUEST", RBAC_ERROR_CODES.ROLE_ALREADY_EXISTS)
      }

      // Gather permissions to copy from the source role
      let permissionIds: string[] = []
      if (ctx.body.copyPermissions) {
        const rolePermissions = await ctx.context.adapter.findMany<RolePermission>({
          model: "rolePermission",
          where: [
            {
              field: "roleId",
              value: sourceRole.id,
            },
          ],
        })

        permissionIds = dedupeIds(rolePermissions.map((rp) => rp.permissionId))

        // Validate permissions exist (single batched query)
        const missingPermissionIds = await findMissingIds(
          ctx.context.adapter,
          "permission",
          permissionIds,
        )

        if (missingPermissionIds.length > 0) {
          throw new APIError("NOT_FOUND", {
            message: `Permission with id ${missingPermissionIds[0]} not found`,
          })
        }
      }

      // Gather users to copy from the source role
      let userIds: string[] = []
      if (ctx.body.copyUsers) {
        const userRoles = await ctx.context.adapter.findMany<UserRole>({
          model: "userRole",
          where: [
            {
              field: "roleId",
              value: sourceRole.id,
            },
          ],
        })

        userIds = dedupeIds(userRoles.map((ur) => ur.userId))

        // Validate users exist (single batched query)
        const missingUserIds = await findMissingIds(
          ctx.context.adapter,
          "user",
          userIds,
        )

        if (missingUserIds.length > 0) {
          throw new APIError("NOT_FOUND", {
            message: `User with id ${missingUserIds[0]} not found`,
          })
        }
      }

      // Create the cloned role
      const role = await ctx.context.adapter.create<Role>({
        model: "role",
        data: {
          name: ctx.body.name,
          key,
          description: ctx.body.description ?? sourceRole.description,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: ctx.body.isActive ?? sourceRole.isActive,
          createdBy: session.user.email,
          updatedBy: session.user.email,
        },
      })

      // Copy permissions to the cloned role
      if (permissionIds.length > 0) {
        await Promise.all(
          permissionIds.map((permissionId) =>
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

      // Copy user assignments to the cloned role
      if (userIds.length > 0) {
        await Promise.all(
          userIds.map((userId) =>
            ctx.context.adapter.create<UserRole>({
              model: "userRole",
              data: {
                roleId: role.id,
                userId: userId,
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
 * `auth.api.rbacUpdateRole`
 *
 * **client:**
 * `authClient.rbac.updateRole`
 */
export const rbacUpdateRole = <O extends RBACPluginOptions>(options: O) => {
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
        name: z.string().trim().min(1).optional().meta({
          description: "The new name of the role.",
        }),
        key: z.string().trim().min(1).optional().meta({
          description: "The new key for the role.",
        }),
        description: z.string().trim().min(1).optional().meta({
          description: "The new description of the role.",
        }),
        isActive: z.boolean().optional().meta({
          description: "Optional flag to set permission active status.",
        }),
        permissionIds: z.array(z.string()).optional().meta({
          description:
            "Optional array of permission IDs to replace current permissions.",
        }),
        userIds: z.array(z.string()).optional().meta({
          description:
            "Optional array of user IDs to replace current users assigned to this role.",
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
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_NOT_FOUND.message],
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
                        enum: [
                          "ROLE_ALREADY_EXISTS",
                          "PERMISSION_NOT_FOUND",
                          "USER_NOT_FOUND",
                        ],
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.ROLE_ALREADY_EXISTS.message,
                          "Permission with id ${permissionId} not found",
                          "User with id ${userId} not found",
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

      const key =
        ctx.body.key !== undefined
          ? validateKey("role", ctx.body.key, validationOptions)
          : undefined

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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      // If updating key, check if new key already exists
      if (key && key !== existingRole.key) {
        const duplicateRole = await ctx.context.adapter.findOne<Role>({
          model: "role",
          where: [
            {
              field: "key",
              value: key,
            },
          ],
        })

        if (duplicateRole) {
          throw APIError.from("BAD_REQUEST", RBAC_ERROR_CODES.ROLE_ALREADY_EXISTS)
        }
      }

      // Dedupe ids to avoid duplicate assignments
      const permissionIds = ctx.body.permissionIds
        ? dedupeIds(ctx.body.permissionIds)
        : undefined
      const userIds = ctx.body.userIds ? dedupeIds(ctx.body.userIds) : undefined

      // If permissionIds provided, validate they exist (single batched query)
      if (permissionIds) {
        const missingPermissionIds = await findMissingIds(
          ctx.context.adapter,
          "permission",
          permissionIds,
        )

        if (missingPermissionIds.length > 0) {
          throw new APIError("NOT_FOUND", {
            message: `Permission with id ${missingPermissionIds[0]} not found`,
          })
        }
      }

      // If userIds provided, validate they exist (single batched query)
      if (userIds) {
        const missingUserIds = await findMissingIds(
          ctx.context.adapter,
          "user",
          userIds,
        )

        if (missingUserIds.length > 0) {
          throw new APIError("NOT_FOUND", {
            message: `User with id ${missingUserIds[0]} not found`,
          })
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

      // Update permissions if provided (incremental update)
      if (permissionIds !== undefined) {
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
        const newPermissionIds = new Set(permissionIds)

        // Find permissions to delete (exist in current but not in new)
        const toDelete = currentPermissions.filter(
          (rp) => !newPermissionIds.has(rp.permissionId),
        )

        // Find permissions to add (exist in new but not in current)
        const toAdd = permissionIds.filter(
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

      // Update users if provided (incremental update)
      if (userIds !== undefined) {
        // Get current users assigned to this role
        const currentUserRoles = await ctx.context.adapter.findMany<UserRole>({
          model: "userRole",
          where: [
            {
              field: "roleId",
              value: ctx.body.id,
            },
          ],
        })

        const currentUserIds = new Set(currentUserRoles.map((ur) => ur.userId))
        const newUserIds = new Set(userIds)

        // Find users to remove (exist in current but not in new)
        const toDelete = currentUserRoles.filter((ur) => !newUserIds.has(ur.userId))

        // Find users to add (exist in new but not in current)
        const toAdd = userIds.filter((userId) => !currentUserIds.has(userId))

        // Delete removed user-role assignments in parallel
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

        // Create new user-role assignments in parallel
        if (toAdd.length > 0) {
          await Promise.all(
            toAdd.map((userId) =>
              ctx.context.adapter.create<UserRole>({
                model: "userRole",
                data: {
                  userId: userId,
                  roleId: ctx.body.id,
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
 * `auth.api.rbacDeleteRole`
 *
 * **client:**
 * `authClient.rbac.deleteRole`
 */
export const rbacDeleteRole = <O extends RBACPluginOptions>(options: O) => {
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
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_NOT_FOUND.message],
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      // Delete associated role-permission mappings to avoid orphans
      await ctx.context.adapter.deleteMany({
        model: "rolePermission",
        where: [{ field: "roleId", value: ctx.body.id }],
      })

      // Delete associated user-role mappings to avoid orphans
      await ctx.context.adapter.deleteMany({
        model: "userRole",
        where: [{ field: "roleId", value: ctx.body.id }],
      })

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
 * `auth.api.rbacGetRolesOptions`
 *
 * **client:**
 * `authClient.rbac.getRolesOptions`
 */
export const rbacGetRolesOptions = <O extends RBACPluginOptions>(options: O) => {
  const paginationConfig = createPaginationConfig(options)

  return createAuthEndpoint(
    "/rbac/get-roles-options",
    {
      method: "GET",
      use: [rbacMiddleware],
      query: z.object({
        onlyActive: z.stringbool().or(z.boolean()).optional().default(true).meta({
          description: "Filter to return only active roles. Defaults to true.",
        }),
        search: z.string().optional().meta({
          description: "Search term to filter roles by name or key.",
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
          operationId: "rbac.getRolesOptions",
          summary: "Get roles as select options",
          description:
            "Get roles formatted as value/label pairs for select components. Supports search and limit parameters.",
          responses: {
            200: {
              description: "Successfully retrieved roles options",
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
                              description: "Role ID",
                            },
                            label: {
                              type: "string",
                              description: "Role name",
                            },
                          },
                        },
                      },
                    },
                    required: ["options"],
                  },
                  examples: {
                    withResults: {
                      summary: "Successful response with roles",
                      value: {
                        options: [
                          {
                            value: "role_123abc",
                            label: "Administrator",
                          },
                          {
                            value: "role_456def",
                            label: "Editor",
                          },
                          {
                            value: "role_789ghi",
                            label: "Viewer",
                          },
                        ],
                      },
                    },
                    emptyResults: {
                      summary: "No roles found",
                      value: {
                        options: [],
                      },
                    },
                    searchFiltered: {
                      summary: "Filtered by search term",
                      value: {
                        options: [
                          {
                            value: "role_123abc",
                            label: "Administrator",
                          },
                          {
                            value: "role_456def",
                            label: "Admin Assistant",
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

      const search = ctx.query?.search?.trim()
      if (search) {
        where.push(
          {
            field: "name",
            operator: "contains",
            value: search,
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
        const filteredRoles = await ctx.context.adapter.findMany<Role>({
          model: "role",
          where: where.length ? where : undefined,
          limit,
          sortBy: {
            field: "name",
            direction: "asc",
          },
        })

        const options = filteredRoles.map((role) => ({
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
 * `auth.api.rbacGetRolePermissions`
 *
 * **client:**
 * `authClient.rbac.getRolePermissions`
 */
export const rbacGetRolePermissions = <O extends RBACPluginOptions>(options: O) => {
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
          sortBy: sortByPermission,
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
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_NOT_FOUND.message],
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      // Get all role-permission mappings for this role
      const rolePermissions = await ctx.context.adapter.findMany<RolePermission>({
        model: "rolePermission",
        where: [{ field: "roleId", value: role.id }],
      })

      // Extract permission IDs
      const permissionIds = rolePermissions.map((rp) => rp.permissionId)

      const { limit, offset } = getPaginationParams(
        ctx.query?.limit,
        ctx.query?.offset,
        paginationConfig,
      )

      // If there are no permissions, return empty result
      if (permissionIds.length === 0) {
        return ctx.json({
          role,
          permissions: [],
          total: 0,
          limit,
          offset,
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
          limit,
          offset,
        })
      } catch {
        return ctx.json({
          role,
          permissions: [],
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
 * GET `/rbac/get-role-users`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacGetRoleUsers`
 *
 * **client:**
 * `authClient.rbac.getRoleUsers`
 */
export const rbacGetRoleUsers = <O extends RBACPluginOptions>(options: O) => {
  const paginationConfig = createPaginationConfig(options)

  return createAuthEndpoint(
    "/rbac/get-role-users",
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
            description: "The value to search in users.",
          }),
          searchField: z.enum(["name", "email"]).optional().meta({
            description:
              "The field to search in, defaults to name. Can be `name` or `email`.",
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
            .meta({ description: "The number of users to return." })
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
          sortBy: sortByUser,
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
          operationId: "rbac.getRoleUsers",
          summary: "Get all users for a role",
          description:
            "Get all users for a role with pagination, search and sorting support",
          responses: {
            200: {
              description: "Role users",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      role: {
                        $ref: "#/components/schemas/Role",
                      },
                      users: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/User",
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
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.ROLE_NOT_FOUND.message],
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
      if (options.disabledEndpoints?.includes("getRoleUsers")) {
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      // Get all user-role mappings for this role
      const userRoles = await ctx.context.adapter.findMany<UserRole>({
        model: "userRole",
        where: [{ field: "roleId", value: role.id }],
      })

      // Extract user IDs
      const userIds = userRoles.map((ur) => ur.userId)

      const { limit, offset } = getPaginationParams(
        ctx.query?.limit,
        ctx.query?.offset,
        paginationConfig,
      )

      // If there are no users, return empty result
      if (userIds.length === 0) {
        return ctx.json({
          role,
          users: [],
          total: 0,
          limit,
          offset,
        })
      }

      // Build where clause for users
      const where: Where[] = [
        {
          field: "id",
          operator: "in",
          value: userIds,
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
        // Get paginated, sorted and filtered users
        const users = await ctx.context.adapter.findMany<User>({
          model: "user",
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

        // Get total count of filtered users
        const total = await ctx.context.adapter.count({
          model: "user",
          where: where.length ? where : undefined,
        })

        return ctx.json({
          role,
          users,
          total,
          limit,
          offset,
        })
      } catch {
        return ctx.json({
          role,
          users: [],
          total: 0,
          limit,
          offset,
        })
      }
    },
  )
}
