import { APIError, createAuthEndpoint } from "better-auth/api"
import * as z from "zod"
import { ensureUserIsAdmin, rbacMiddleware } from "../call"
import { RBAC_ERROR_CODES } from "../error-codes"
import type {
  Permission,
  RBACPluginOptions,
  Role,
  RolePermission,
  User,
  UserRole,
} from "../types"

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
export const assignPermissionToRole = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
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
      if (options.disabledEndpoints?.includes("assignPermissionToRole")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

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
  )
}

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
export const removePermissionFromRole = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
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
      if (options.disabledEndpoints?.includes("removePermissionFromRole")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Delete assignment
      await ctx.context.adapter.deleteMany({
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
  )
}

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
export const assignRoleToUser = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
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
      if (options.disabledEndpoints?.includes("assignRoleToUser")) {
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
  )
}

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
export const removeRoleFromUser = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
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
      if (options.disabledEndpoints?.includes("removeRoleFromUser")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Delete assignment
      await ctx.context.adapter.deleteMany({
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
  )
}
