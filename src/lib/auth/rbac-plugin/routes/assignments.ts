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
 * `auth.api.rbacAssignPermissionToRole`
 *
 * **client:**
 * `authClient.rbac.assignPermissionToRole`
 */
export const rbacAssignPermissionToRole = <O extends RBACPluginOptions>(options: O) => {
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.PERMISSION_NOT_FOUND)
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
 * `auth.api.rbacRemovePermissionFromRole`
 *
 * **client:**
 * `authClient.rbac.removePermissionFromRole`
 */
export const rbacRemovePermissionFromRole = <O extends RBACPluginOptions>(
  options: O,
) => {
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
 * `auth.api.rbacAssignRoleToUser`
 *
 * **client:**
 * `authClient.rbac.assignRoleToUser`
 */
export const rbacAssignRoleToUser = <O extends RBACPluginOptions>(options: O) => {
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.USER_NOT_FOUND)
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
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
 * `auth.api.rbacRemoveRoleFromUser`
 *
 * **client:**
 * `authClient.rbac.removeRoleFromUser`
 */
export const rbacRemoveRoleFromUser = <O extends RBACPluginOptions>(options: O) => {
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

/**
 * ### Endpoint
 *
 * POST `/rbac/bulk-assign-role-to-users`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacBulkAssignRoleToUsers`
 *
 * **client:**
 * `authClient.rbac.bulkAssignRoleToUsers`
 */
export const rbacBulkAssignRoleToUsers = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/bulk-assign-role-to-users",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        roleId: z.string().meta({
          description: "The id of the role to assign.",
        }),
        userIds: z.array(z.string()).meta({
          description: "The ids of the users to assign the role to.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkAssignRoleToUsers",
          summary: "Assign a role to multiple users",
          description:
            "Assign a role to multiple users in a single call. Users who already have the role are skipped.",
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
                      },
                      assignedCount: {
                        type: "number",
                      },
                      skippedCount: {
                        type: "number",
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
      if (options.disabledEndpoints?.includes("bulkAssignRoleToUsers")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      if (ctx.body.userIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No users provided",
          assignedCount: 0,
          skippedCount: 0,
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      let assignedCount = 0
      let skippedCount = 0

      for (const userId of ctx.body.userIds) {
        // Check if user exists
        const user = await ctx.context.adapter.findOne<User>({
          model: "user",
          where: [
            {
              field: "id",
              value: userId,
            },
          ],
        })

        if (!user) {
          throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.USER_NOT_FOUND)
        }

        // Skip if assignment already exists
        const existingAssignment = await ctx.context.adapter.findOne<UserRole>({
          model: "userRole",
          where: [
            {
              field: "userId",
              value: userId,
            },
            {
              field: "roleId",
              value: ctx.body.roleId,
            },
          ],
        })

        if (existingAssignment) {
          skippedCount++
          continue
        }

        // Create assignment
        await ctx.context.adapter.create<UserRole>({
          model: "userRole",
          data: {
            userId: userId,
            roleId: ctx.body.roleId,
            createdAt: new Date(),
          },
        })

        assignedCount++
      }

      return ctx.json({
        success: true,
        message: `Role assigned to ${assignedCount} user(s)`,
        assignedCount,
        skippedCount,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/bulk-remove-role-from-users`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacBulkRemoveRoleFromUsers`
 *
 * **client:**
 * `authClient.rbac.bulkRemoveRoleFromUsers`
 */
export const rbacBulkRemoveRoleFromUsers = <O extends RBACPluginOptions>(
  options: O,
) => {
  return createAuthEndpoint(
    "/rbac/bulk-remove-role-from-users",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        roleId: z.string().meta({
          description: "The id of the role to remove.",
        }),
        userIds: z.array(z.string()).meta({
          description: "The ids of the users to remove the role from.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkRemoveRoleFromUsers",
          summary: "Remove a role from multiple users",
          description: "Remove a role from multiple users in a single call.",
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
                      },
                      removedCount: {
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
      if (options.disabledEndpoints?.includes("bulkRemoveRoleFromUsers")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      if (ctx.body.userIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No users provided",
          removedCount: 0,
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      // Delete assignments
      await ctx.context.adapter.deleteMany({
        model: "userRole",
        where: [
          {
            field: "roleId",
            value: ctx.body.roleId,
          },
          {
            field: "userId",
            operator: "in",
            value: ctx.body.userIds,
          },
        ],
      })

      return ctx.json({
        success: true,
        message: `Role removed from ${ctx.body.userIds.length} user(s)`,
        removedCount: ctx.body.userIds.length,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/bulk-assign-permissions-to-role`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacBulkAssignPermissionsToRole`
 *
 * **client:**
 * `authClient.rbac.bulkAssignPermissionsToRole`
 */
export const rbacBulkAssignPermissionsToRole = <O extends RBACPluginOptions>(
  options: O,
) => {
  return createAuthEndpoint(
    "/rbac/bulk-assign-permissions-to-role",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        roleId: z.string().meta({
          description: "The id of the role.",
        }),
        permissionIds: z.array(z.string()).meta({
          description: "The ids of the permissions to assign.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkAssignPermissionsToRole",
          summary: "Assign multiple permissions to a role",
          description:
            "Assign multiple permissions to a role in a single call. Permissions already assigned to the role are skipped.",
          responses: {
            200: {
              description: "Permissions assigned successfully",
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
                      assignedCount: {
                        type: "number",
                      },
                      skippedCount: {
                        type: "number",
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
      if (options.disabledEndpoints?.includes("bulkAssignPermissionsToRole")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      if (ctx.body.permissionIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No permissions provided",
          assignedCount: 0,
          skippedCount: 0,
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      let assignedCount = 0
      let skippedCount = 0

      for (const permissionId of ctx.body.permissionIds) {
        // Check if permission exists
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
          throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.PERMISSION_NOT_FOUND)
        }

        // Skip if assignment already exists
        const existingAssignment = await ctx.context.adapter.findOne<RolePermission>({
          model: "rolePermission",
          where: [
            {
              field: "roleId",
              value: ctx.body.roleId,
            },
            {
              field: "permissionId",
              value: permissionId,
            },
          ],
        })

        if (existingAssignment) {
          skippedCount++
          continue
        }

        // Create assignment
        await ctx.context.adapter.create<RolePermission>({
          model: "rolePermission",
          data: {
            roleId: ctx.body.roleId,
            permissionId: permissionId,
            createdAt: new Date(),
          },
        })

        assignedCount++
      }

      return ctx.json({
        success: true,
        message: `Assigned ${assignedCount} permission(s) to role`,
        assignedCount,
        skippedCount,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/bulk-remove-permissions-from-role`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacBulkRemovePermissionsFromRole`
 *
 * **client:**
 * `authClient.rbac.bulkRemovePermissionsFromRole`
 */
export const rbacBulkRemovePermissionsFromRole = <O extends RBACPluginOptions>(
  options: O,
) => {
  return createAuthEndpoint(
    "/rbac/bulk-remove-permissions-from-role",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        roleId: z.string().meta({
          description: "The id of the role.",
        }),
        permissionIds: z.array(z.string()).meta({
          description: "The ids of the permissions to remove.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkRemovePermissionsFromRole",
          summary: "Remove multiple permissions from a role",
          description: "Remove multiple permissions from a role in a single call.",
          responses: {
            200: {
              description: "Permissions removed successfully",
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
                      removedCount: {
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
      if (options.disabledEndpoints?.includes("bulkRemovePermissionsFromRole")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      if (ctx.body.permissionIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No permissions provided",
          removedCount: 0,
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
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      // Delete assignments
      await ctx.context.adapter.deleteMany({
        model: "rolePermission",
        where: [
          {
            field: "roleId",
            value: ctx.body.roleId,
          },
          {
            field: "permissionId",
            operator: "in",
            value: ctx.body.permissionIds,
          },
        ],
      })

      return ctx.json({
        success: true,
        message: `Removed ${ctx.body.permissionIds.length} permission(s) from role`,
        removedCount: ctx.body.permissionIds.length,
      })
    },
  )
}
