import { APIError, createAuthEndpoint } from "better-auth/api"
import * as z from "zod"
import { assignBatch } from "../batch-assign"
import { ensureUserIsAdmin, rbacMiddleware } from "../call"
import { RBAC_ERROR_CODES } from "../error-codes"
import type {
  Permission,
  RBACPluginOptions,
  Role,
  RolePermission,
  RolePermissionCreateInput,
  User,
  UserRole,
  UserRoleCreateInput,
} from "../types"
import { findMissingIds, normalizeIdBatch } from "../utils"

function assertRoleModifiable(role: Role): void {
  if (role.isSystem) {
    throw APIError.from("BAD_REQUEST", RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_ROLE)
  }
}

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
          example: "role_8xKdMqQ2",
        }),
        permissionId: z.string().meta({
          description: "The id of the permission to assign.",
          example: "permission_2nQxLvK8",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.assignPermissionToRole",
          summary: "Assign a permission to a role",
          description:
            "Assign a permission to a role. If the permission is already assigned to the role, the call is a no-op and returns `Permission already assigned to role`.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roleId: {
                      type: "string",
                      description: "The id of the role.",
                      example: "role_8xKdMqQ2",
                    },
                    permissionId: {
                      type: "string",
                      description: "The id of the permission to assign.",
                      example: "permission_2nQxLvK8",
                    },
                  },
                  required: ["roleId", "permissionId"],
                },
              },
            },
          },
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description:
                          "Human-readable result. `Permission already assigned to role` when the assignment already existed, `Permission assigned to role successfully` when it was created.",
                        enum: [
                          "Permission already assigned to role",
                          "Permission assigned to role successfully",
                        ],
                        example: "Permission assigned to role successfully",
                      },
                    },
                  },
                  examples: {
                    assigned: {
                      summary: "Permission assigned to role",
                      value: {
                        success: true,
                        message: "Permission assigned to role successfully",
                      },
                    },
                    alreadyAssigned: {
                      summary: "Permission already assigned to role",
                      value: {
                        success: true,
                        message: "Permission already assigned to role",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "The target role is a system entity and cannot be modified",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["CANNOT_MODIFY_SYSTEM_ROLE"],
                        description: "The error code.",
                        example: "CANNOT_MODIFY_SYSTEM_ROLE",
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_ROLE.message],
                        description: "Human-readable error message.",
                        example: "Cannot modify system role.",
                      },
                    },
                  },
                  examples: {
                    cannotModifySystemRole: {
                      summary: "Cannot modify system role.",
                      value: {
                        code: "CANNOT_MODIFY_SYSTEM_ROLE",
                        message: "Cannot modify system role.",
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
                          "Human-readable error message. `Role not found.` when the role does not exist, `Permission not found.` when the permission does not exist.",
                        example: "Role not found.",
                      },
                    },
                  },
                  examples: {
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
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

      assertRoleModifiable(role)

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
      try {
        await ctx.context.adapter.create<RolePermissionCreateInput, RolePermission>({
          model: "rolePermission",
          data: {
            roleId: ctx.body.roleId,
            permissionId: ctx.body.permissionId,
          },
        })
      } catch (error) {
        // Concurrent request may have created the assignment between check and create
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
        if (!existingAssignment) {
          throw error
        }
      }

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
          example: "role_8xKdMqQ2",
        }),
        permissionId: z.string().meta({
          description: "The id of the permission to remove.",
          example: "permission_2nQxLvK8",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.removePermissionFromRole",
          summary: "Remove a permission from a role",
          description:
            "Remove a permission from a role. If the permission is not assigned to the role, the call is a no-op and still succeeds.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roleId: {
                      type: "string",
                      description: "The id of the role.",
                      example: "role_8xKdMqQ2",
                    },
                    permissionId: {
                      type: "string",
                      description: "The id of the permission to remove.",
                      example: "permission_2nQxLvK8",
                    },
                  },
                  required: ["roleId", "permissionId"],
                },
              },
            },
          },
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        enum: ["Permission removed from role successfully"],
                        description:
                          "Human-readable result. Always `Permission removed from role successfully`.",
                        example: "Permission removed from role successfully",
                      },
                    },
                  },
                  examples: {
                    removed: {
                      summary: "Permission removed from role",
                      value: {
                        success: true,
                        message: "Permission removed from role successfully",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "The target role is a system entity and cannot be modified",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["CANNOT_MODIFY_SYSTEM_ROLE"],
                        description: "The error code.",
                        example: "CANNOT_MODIFY_SYSTEM_ROLE",
                      },
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_ROLE.message],
                        description: "Human-readable error message.",
                        example: "Cannot modify system role.",
                      },
                    },
                  },
                  examples: {
                    cannotModifySystemRole: {
                      summary: "Cannot modify system role.",
                      value: {
                        code: "CANNOT_MODIFY_SYSTEM_ROLE",
                        message: "Cannot modify system role.",
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
                          "Human-readable error message. `Role not found.` when the role does not exist, `Permission not found.` when the permission does not exist.",
                        example: "Role not found.",
                      },
                    },
                  },
                  examples: {
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
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

      assertRoleModifiable(role)

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
          example: "user_9mQGfY2Z",
        }),
        roleId: z.string().meta({
          description: "The id of the role to assign.",
          example: "role_8xKdMqQ2",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.assignRoleToUser",
          summary: "Assign a role to a user",
          description:
            "Assign a role to a user. If the user already has the role, the call is a no-op and returns `Role already assigned to user`.",
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
                    roleId: {
                      type: "string",
                      description: "The id of the role to assign.",
                      example: "role_8xKdMqQ2",
                    },
                  },
                  required: ["userId", "roleId"],
                },
              },
            },
          },
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description:
                          "Human-readable result. `Role already assigned to user` when the assignment already existed, `Role assigned to user successfully` when it was created.",
                        enum: [
                          "Role already assigned to user",
                          "Role assigned to user successfully",
                        ],
                        example: "Role assigned to user successfully",
                      },
                    },
                  },
                  examples: {
                    assigned: {
                      summary: "Role assigned to user",
                      value: {
                        success: true,
                        message: "Role assigned to user successfully",
                      },
                    },
                    alreadyAssigned: {
                      summary: "Role already assigned to user",
                      value: {
                        success: true,
                        message: "Role already assigned to user",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid request body.",
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
                          "[body.roleId] Invalid input: expected string, received undefined",
                      },
                    },
                  },
                  examples: {
                    validationError: {
                      summary: "Invalid request body",
                      value: {
                        code: "VALIDATION_ERROR",
                        message:
                          "[body.roleId] Invalid input: expected string, received undefined",
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
                          "Human-readable error message. `User not found.` when the user does not exist, `Role not found.` when the role does not exist.",
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
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
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
      try {
        await ctx.context.adapter.create<UserRoleCreateInput, UserRole>({
          model: "userRole",
          data: {
            userId: ctx.body.userId,
            roleId: ctx.body.roleId,
          },
        })
      } catch (error) {
        // Concurrent request may have created the assignment between check and create
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
        if (!existingAssignment) {
          throw error
        }
      }

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
          example: "user_9mQGfY2Z",
        }),
        roleId: z.string().meta({
          description: "The id of the role to remove.",
          example: "role_8xKdMqQ2",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.removeRoleFromUser",
          summary: "Remove a role from a user",
          description:
            "Remove a role from a user. Removing a role the user does not have is a no-op.",
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
                    roleId: {
                      type: "string",
                      description: "The id of the role to remove.",
                      example: "role_8xKdMqQ2",
                    },
                  },
                  required: ["userId", "roleId"],
                },
              },
            },
          },
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        enum: ["Role removed from user successfully"],
                        description:
                          "Human-readable result. Always `Role removed from user successfully`.",
                        example: "Role removed from user successfully",
                      },
                    },
                  },
                  examples: {
                    removed: {
                      summary: "Role removed from user",
                      value: {
                        success: true,
                        message: "Role removed from user successfully",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Invalid request body.",
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
                          "[body.roleId] Invalid input: expected string, received undefined",
                      },
                    },
                  },
                  examples: {
                    validationError: {
                      summary: "Invalid request body",
                      value: {
                        code: "VALIDATION_ERROR",
                        message:
                          "[body.roleId] Invalid input: expected string, received undefined",
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
                          "Human-readable error message. `User not found.` when the user does not exist, `Role not found.` when the role does not exist.",
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
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
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
          example: "role_8xKdMqQ2",
        }),
        userIds: z.array(z.string()).meta({
          description: "The ids of the users to assign the role to.",
          example: ["user_9mQGfY2Z", "user_2pQkLmW6"],
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkAssignRoleToUsers",
          summary: "Assign a role to multiple users",
          description:
            "Assign a role to multiple users in a single call. Users who already have the role are skipped.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roleId: {
                      type: "string",
                      description: "The id of the role to assign.",
                      example: "role_8xKdMqQ2",
                    },
                    userIds: {
                      type: "array",
                      description: "The ids of the users to assign the role to.",
                      items: { type: "string" },
                      example: ["user_9mQGfY2Z", "user_2pQkLmW6"],
                    },
                  },
                  required: ["roleId", "userIds"],
                },
              },
            },
          },
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description:
                          "Human-readable summary of the result. `Role assigned to N user(s)` when the batch was processed, `No users provided` when the `userIds` array was empty.",
                        example: "Role assigned to 2 user(s)",
                      },
                      assignedCount: {
                        type: "number",
                        description: "Number of users the role was assigned to.",
                        example: 2,
                      },
                      skippedCount: {
                        type: "number",
                        description: "Number of users that already had the role.",
                        example: 1,
                      },
                    },
                  },
                  examples: {
                    assigned: {
                      summary: "Role assigned to users",
                      value: {
                        success: true,
                        message: "Role assigned to 2 user(s)",
                        assignedCount: 2,
                        skippedCount: 1,
                      },
                    },
                    noUsersAssigned: {
                      summary: "No users in batch",
                      value: {
                        success: true,
                        message: "No users provided",
                        assignedCount: 0,
                        skippedCount: 0,
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
                          "Human-readable error message. `User not found.` when the user does not exist, `Role not found.` when at least one role does not exist.",
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
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
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

      // Check if role exists (before the empty-array short-circuit so invalid
      // targets never look like a successful no-op)
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

      if (ctx.body.userIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No users provided",
          assignedCount: 0,
          skippedCount: 0,
        })
      }

      const userIds = normalizeIdBatch(ctx.body.userIds, options, "userIds")

      // Validate all users exist (single batched query)
      const missingUserIds = await findMissingIds(ctx.context.adapter, "user", userIds)

      if (missingUserIds.length > 0) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.USER_NOT_FOUND)
      }

      const { assignedCount, skippedCount } = await assignBatch({
        adapter: ctx.context.adapter,
        model: "userRole",
        targetField: "roleId",
        targetValue: ctx.body.roleId,
        itemField: "userId",
        itemIds: userIds,
        buildData: (userId) => ({ userId, roleId: ctx.body.roleId }),
        concurrency: options.maxBatchWriteConcurrency,
      })

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
          example: "role_8xKdMqQ2",
        }),
        userIds: z.array(z.string()).meta({
          description: "The ids of the users to remove the role from.",
          example: ["user_9mQGfY2Z", "user_2pQkLmW6"],
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkRemoveRoleFromUsers",
          summary: "Remove a role from multiple users",
          description: "Remove a role from multiple users in a single call.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roleId: {
                      type: "string",
                      description: "The id of the role to remove.",
                      example: "role_8xKdMqQ2",
                    },
                    userIds: {
                      type: "array",
                      description: "The ids of the users to remove the role from.",
                      items: { type: "string" },
                      example: ["user_9mQGfY2Z", "user_2pQkLmW6"],
                    },
                  },
                  required: ["roleId", "userIds"],
                },
              },
            },
          },
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description:
                          "Human-readable summary of the result. `Role removed from N user(s)` when the batch was processed, `No users provided` when the `userIds` array was empty.",
                        example: "Role removed from 2 user(s)",
                      },
                      removedCount: {
                        type: "number",
                        description: "Number of users the role was removed from.",
                        example: 2,
                      },
                    },
                  },
                  examples: {
                    removed: {
                      summary: "Role removed from users",
                      value: {
                        success: true,
                        message: "Role removed from 2 user(s)",
                        removedCount: 2,
                      },
                    },
                    noUsersRemoved: {
                      summary: "No users in batch",
                      value: {
                        success: true,
                        message: "No users provided",
                        removedCount: 0,
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
                          "Human-readable error message. `User not found.` when at least one user does not exist, `Role not found.` when the role does not exist.",
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
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
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

      // Check if role exists (before the empty-array short-circuit so invalid
      // targets never look like a successful no-op)
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

      if (ctx.body.userIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No users provided",
          removedCount: 0,
        })
      }

      const userIds = normalizeIdBatch(ctx.body.userIds, options, "userIds")

      // Validate all users exist (single batched query)
      const missingUserIds = await findMissingIds(ctx.context.adapter, "user", userIds)

      if (missingUserIds.length > 0) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.USER_NOT_FOUND)
      }

      // Delete assignments
      const removedCount = await ctx.context.adapter.deleteMany({
        model: "userRole",
        where: [
          {
            field: "roleId",
            value: ctx.body.roleId,
          },
          {
            field: "userId",
            operator: "in",
            value: userIds,
          },
        ],
      })

      return ctx.json({
        success: true,
        message: `Role removed from ${removedCount} user(s)`,
        removedCount,
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
          example: "role_8xKdMqQ2",
        }),
        permissionIds: z.array(z.string()).meta({
          description: "The ids of the permissions to assign.",
          example: ["permission_2nQxLvK8", "permission_5fRtYmX4"],
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkAssignPermissionsToRole",
          summary: "Assign multiple permissions to a role",
          description:
            "Assign multiple permissions to a role in a single call. Permissions already assigned to the role are skipped.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roleId: {
                      type: "string",
                      description: "The id of the role.",
                      example: "role_8xKdMqQ2",
                    },
                    permissionIds: {
                      type: "array",
                      description: "The ids of the permissions to assign.",
                      items: { type: "string" },
                      example: ["permission_2nQxLvK8", "permission_5fRtYmX4"],
                    },
                  },
                  required: ["roleId", "permissionIds"],
                },
              },
            },
          },
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description:
                          "Human-readable summary of the result. `Assigned N permission(s) to role` when the batch was processed, `No permissions provided` when the `permissionIds` array was empty.",
                        example: "Assigned 2 permission(s) to role",
                      },
                      assignedCount: {
                        type: "number",
                        description: "Number of permissions assigned to the role.",
                        example: 2,
                      },
                      skippedCount: {
                        type: "number",
                        description:
                          "Number of permissions already assigned to the role.",
                        example: 1,
                      },
                    },
                  },
                  examples: {
                    assigned: {
                      summary: "Permissions assigned to role",
                      value: {
                        success: true,
                        message: "Assigned 3 permission(s) to role",
                        assignedCount: 3,
                        skippedCount: 1,
                      },
                    },
                    noPermissionsAssigned: {
                      summary: "No permissions in batch",
                      value: {
                        success: true,
                        message: "No permissions provided",
                        assignedCount: 0,
                        skippedCount: 0,
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Batch size cap was exceeded or the target role is a system entity",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["BATCH_TOO_LARGE", "CANNOT_MODIFY_SYSTEM_ROLE"],
                        description: "The error code.",
                        example: "BATCH_TOO_LARGE",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.BATCH_TOO_LARGE.message,
                          RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_ROLE.message,
                        ],
                        description:
                          "Human-readable error message. `Too many ids provided in a single request.` when the batch cap was exceeded, `Cannot modify system role.` when a target role is a system entity and cannot be modified.",
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
                    cannotModifySystemRole: {
                      summary: "Cannot modify system role.",
                      value: {
                        code: "CANNOT_MODIFY_SYSTEM_ROLE",
                        message: "Cannot modify system role.",
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
                          "Human-readable error message. `Role not found.` when the role does not exist, `Permission not found.` when at least one permission does not exist.",
                        example: "Role not found.",
                      },
                    },
                  },
                  examples: {
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
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

      // Check if role exists (before the empty-array short-circuit so invalid
      // targets never look like a successful no-op)
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

      assertRoleModifiable(role)

      if (ctx.body.permissionIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No permissions provided",
          assignedCount: 0,
          skippedCount: 0,
        })
      }

      const permissionIds = normalizeIdBatch(
        ctx.body.permissionIds,
        options,
        "permissionIds",
      )

      // Validate all permissions exist (single batched query)
      const missingPermissionIds = await findMissingIds(
        ctx.context.adapter,
        "permission",
        permissionIds,
      )

      if (missingPermissionIds.length > 0) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.PERMISSION_NOT_FOUND)
      }

      const { assignedCount, skippedCount } = await assignBatch({
        adapter: ctx.context.adapter,
        model: "rolePermission",
        targetField: "roleId",
        targetValue: ctx.body.roleId,
        itemField: "permissionId",
        itemIds: permissionIds,
        buildData: (permissionId) => ({
          roleId: ctx.body.roleId,
          permissionId,
        }),
        concurrency: options.maxBatchWriteConcurrency,
      })

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
          example: "role_8xKdMqQ2",
        }),
        permissionIds: z.array(z.string()).meta({
          description: "The ids of the permissions to remove.",
          example: ["permission_2nQxLvK8", "permission_5fRtYmX4"],
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkRemovePermissionsFromRole",
          summary: "Remove multiple permissions from a role",
          description: "Remove multiple permissions from a role in a single call.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roleId: {
                      type: "string",
                      description: "The id of the role.",
                      example: "role_8xKdMqQ2",
                    },
                    permissionIds: {
                      type: "array",
                      description: "The ids of the permissions to remove.",
                      items: { type: "string" },
                      example: ["permission_2nQxLvK8", "permission_5fRtYmX4"],
                    },
                  },
                  required: ["roleId", "permissionIds"],
                },
              },
            },
          },
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description:
                          "Human-readable summary of the result. `Removed N permission(s) from role` when the batch was processed, `No permissions provided` when the `permissionIds` array was empty.",
                        example: "Removed 2 permission(s) from role",
                      },
                      removedCount: {
                        type: "number",
                        description: "Number of permissions removed from the role.",
                        example: 2,
                      },
                    },
                  },
                  examples: {
                    removed: {
                      summary: "Permissions removed from role",
                      value: {
                        success: true,
                        message: "Removed 3 permission(s) from role",
                        removedCount: 3,
                      },
                    },
                    noPermissionsRemoved: {
                      summary: "No permissions in batch",
                      value: {
                        success: true,
                        message: "No permissions provided",
                        removedCount: 0,
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Batch size cap was exceeded or the target role is a system entity",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["BATCH_TOO_LARGE", "CANNOT_MODIFY_SYSTEM_ROLE"],
                        description: "The error code.",
                        example: "BATCH_TOO_LARGE",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.BATCH_TOO_LARGE.message,
                          RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_ROLE.message,
                        ],
                        description:
                          "Human-readable error message. `Too many ids provided in a single request.` when the batch cap was exceeded, `Cannot modify system role.` when a target role is a system entity and cannot be modified.",
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
                    cannotModifySystemRole: {
                      summary: "Cannot modify system role.",
                      value: {
                        code: "CANNOT_MODIFY_SYSTEM_ROLE",
                        message: "Cannot modify system role.",
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
                          "Human-readable error message. `Role not found.` when the role does not exist, `Permission not found.` when at least one permission does not exist.",
                        example: "Role not found.",
                      },
                    },
                  },
                  examples: {
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
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

      // Check if role exists (before the empty-array short-circuit so invalid
      // targets never look like a successful no-op)
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

      assertRoleModifiable(role)

      if (ctx.body.permissionIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No permissions provided",
          removedCount: 0,
        })
      }

      const permissionIds = normalizeIdBatch(
        ctx.body.permissionIds,
        options,
        "permissionIds",
      )

      // Validate all permissions exist (single batched query)
      const missingPermissionIds = await findMissingIds(
        ctx.context.adapter,
        "permission",
        permissionIds,
      )

      if (missingPermissionIds.length > 0) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.PERMISSION_NOT_FOUND)
      }

      // Delete assignments
      const removedCount = await ctx.context.adapter.deleteMany({
        model: "rolePermission",
        where: [
          {
            field: "roleId",
            value: ctx.body.roleId,
          },
          {
            field: "permissionId",
            operator: "in",
            value: permissionIds,
          },
        ],
      })

      return ctx.json({
        success: true,
        message: `Removed ${removedCount} permission(s) from role`,
        removedCount,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/bulk-remove-roles-from-user`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacBulkRemoveRolesFromUser`
 *
 * **client:**
 * `authClient.rbac.bulkRemoveRolesFromUser`
 */
export const rbacBulkRemoveRolesFromUser = <O extends RBACPluginOptions>(
  options: O,
) => {
  return createAuthEndpoint(
    "/rbac/bulk-remove-roles-from-user",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        userId: z.string().meta({
          description: "The id of the user.",
          example: "user_9mQGfY2Z",
        }),
        roleIds: z.array(z.string()).meta({
          description: "The ids of the roles to remove.",
          example: ["role_8xKdMqQ2", "role_7jOpYz83"],
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkRemoveRolesFromUser",
          summary: "Remove multiple roles from a user",
          description: "Remove multiple roles from a user in a single call.",
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
                      description: "The ids of the roles to remove.",
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
              description: "Roles removed successfully",
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
                        description:
                          "Human-readable summary of the result. `Removed N role(s) from user` when the batch was processed, `No roles provided` when the `roleIds` array was empty.",
                        example: "Removed 2 role(s) from user",
                      },
                      removedCount: {
                        type: "number",
                        description: "Number of roles removed from the user.",
                        example: 2,
                      },
                    },
                  },
                  examples: {
                    removed: {
                      summary: "Roles removed from user",
                      value: {
                        success: true,
                        message: "Removed 2 role(s) from user",
                        removedCount: 2,
                      },
                    },
                    noRolesRemoved: {
                      summary: "No roles in batch",
                      value: {
                        success: true,
                        message: "No roles provided",
                        removedCount: 0,
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
              description: "User not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
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
      if (options.disabledEndpoints?.includes("bulkRemoveRolesFromUser")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Check if user exists (before the empty-array short-circuit so invalid
      // targets never look like a successful no-op)
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

      if (ctx.body.roleIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No roles provided",
          removedCount: 0,
        })
      }

      const roleIds = normalizeIdBatch(ctx.body.roleIds, options, "roleIds")

      // Delete assignments
      const removedCount = await ctx.context.adapter.deleteMany({
        model: "userRole",
        where: [
          {
            field: "userId",
            value: ctx.body.userId,
          },
          {
            field: "roleId",
            operator: "in",
            value: roleIds,
          },
        ],
      })

      return ctx.json({
        success: true,
        message: `Removed ${removedCount} role(s) from user`,
        removedCount,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/bulk-remove-roles-from-permission`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacBulkRemoveRolesFromPermission`
 *
 * **client:**
 * `authClient.rbac.bulkRemoveRolesFromPermission`
 */
export const rbacBulkRemoveRolesFromPermission = <O extends RBACPluginOptions>(
  options: O,
) => {
  return createAuthEndpoint(
    "/rbac/bulk-remove-roles-from-permission",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        permissionId: z.string().meta({
          description: "The id of the permission.",
          example: "permission_2nQxLvK8",
        }),
        roleIds: z.array(z.string()).meta({
          description: "The ids of the roles to remove.",
          example: ["role_8xKdMqQ2", "role_7jOpYz83"],
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkRemoveRolesFromPermission",
          summary: "Remove multiple roles from a permission",
          description: "Remove multiple roles from a permission in a single call.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    permissionId: {
                      type: "string",
                      description: "The id of the permission.",
                      example: "permission_2nQxLvK8",
                    },
                    roleIds: {
                      type: "array",
                      description: "The ids of the roles to remove.",
                      items: { type: "string" },
                      example: ["role_8xKdMqQ2", "role_7jOpYz83"],
                    },
                  },
                  required: ["permissionId", "roleIds"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Roles removed successfully",
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
                        description:
                          "Human-readable summary of the result. `Removed N role(s) from permission` when the batch was processed, `No roles provided` when the `roleIds` array was empty.",
                        example: "Removed 2 role(s) from permission",
                      },
                      removedCount: {
                        type: "number",
                        description: "Number of roles removed from the permission.",
                        example: 2,
                      },
                    },
                  },
                  examples: {
                    removed: {
                      summary: "Roles removed from permission",
                      value: {
                        success: true,
                        message: "Removed 2 role(s) from permission",
                        removedCount: 2,
                      },
                    },
                    noRolesRemoved: {
                      summary: "No roles in batch",
                      value: {
                        success: true,
                        message: "No roles provided",
                        removedCount: 0,
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Batch size cap was exceeded or a target role is a system entity",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["BATCH_TOO_LARGE", "CANNOT_MODIFY_SYSTEM_ROLE"],
                        description: "The error code.",
                        example: "BATCH_TOO_LARGE",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.BATCH_TOO_LARGE.message,
                          RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_ROLE.message,
                        ],
                        description:
                          "Human-readable error message. `Too many ids provided in a single request.` when the batch cap was exceeded, `Cannot modify system role.` when a target role is a system entity and cannot be modified.",
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
                    cannotModifySystemRole: {
                      summary: "Cannot modify system role.",
                      value: {
                        code: "CANNOT_MODIFY_SYSTEM_ROLE",
                        message: "Cannot modify system role.",
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
      if (options.disabledEndpoints?.includes("bulkRemoveRolesFromPermission")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Check if permission exists (before the empty-array short-circuit so invalid
      // targets never look like a successful no-op)
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

      if (ctx.body.roleIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No roles provided",
          removedCount: 0,
        })
      }

      const roleIds = normalizeIdBatch(ctx.body.roleIds, options, "roleIds")

      // Validate all target roles exist and are not system entities (single
      // batched query so invalid targets never look like a successful no-op)
      const roles = await ctx.context.adapter.findMany<Role>({
        model: "role",
        where: [{ field: "id", operator: "in", value: roleIds }],
      })

      if (roles.length !== roleIds.length) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      roles.forEach(assertRoleModifiable)

      // Delete assignments
      const removedCount = await ctx.context.adapter.deleteMany({
        model: "rolePermission",
        where: [
          {
            field: "permissionId",
            value: ctx.body.permissionId,
          },
          {
            field: "roleId",
            operator: "in",
            value: roleIds,
          },
        ],
      })

      return ctx.json({
        success: true,
        message: `Removed ${removedCount} role(s) from permission`,
        removedCount,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/bulk-assign-roles-to-user`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacBulkAssignRolesToUser`
 *
 * **client:**
 * `authClient.rbac.bulkAssignRolesToUser`
 */
export const rbacBulkAssignRolesToUser = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/bulk-assign-roles-to-user",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        userId: z.string().meta({
          description: "The id of the user.",
          example: "user_9mQGfY2Z",
        }),
        roleIds: z.array(z.string()).meta({
          description: "The ids of the roles to assign.",
          example: ["role_8xKdMqQ2", "role_7jOpYz83"],
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkAssignRolesToUser",
          summary: "Assign multiple roles to a user",
          description:
            "Assign multiple roles to a user in a single call. Roles already assigned to the user are skipped.",
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
                      description: "The ids of the roles to assign.",
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
              description: "Roles assigned successfully",
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
                        description:
                          "Human-readable summary of the result. `Assigned N role(s) to user` when the batch was processed, `No roles provided` when the `roleIds` array was empty.",
                        example: "Assigned 2 role(s) to user",
                      },
                      assignedCount: {
                        type: "number",
                        description: "Number of roles assigned to the user.",
                        example: 2,
                      },
                      skippedCount: {
                        type: "number",
                        description: "Number of roles already assigned and skipped.",
                        example: 1,
                      },
                    },
                  },
                  examples: {
                    assigned: {
                      summary: "Roles assigned to user",
                      value: {
                        success: true,
                        message: "Assigned 2 role(s) to user",
                        assignedCount: 2,
                        skippedCount: 1,
                      },
                    },
                    noRolesAssigned: {
                      summary: "No roles in batch",
                      value: {
                        success: true,
                        message: "No roles provided",
                        assignedCount: 0,
                        skippedCount: 0,
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
                          "Human-readable error message. `User not found.` when the user does not exist, `Role not found.` when at least one role does not exist.",
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
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
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
      if (options.disabledEndpoints?.includes("bulkAssignRolesToUser")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Check if user exists (before the empty-array short-circuit so invalid
      // targets never look like a successful no-op)
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

      if (ctx.body.roleIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No roles provided",
          assignedCount: 0,
          skippedCount: 0,
        })
      }

      const roleIds = normalizeIdBatch(ctx.body.roleIds, options, "roleIds")

      // Validate all roles exist (single batched query)
      const missingRoleIds = await findMissingIds(ctx.context.adapter, "role", roleIds)

      if (missingRoleIds.length > 0) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      const { assignedCount, skippedCount } = await assignBatch({
        adapter: ctx.context.adapter,
        model: "userRole",
        targetField: "userId",
        targetValue: ctx.body.userId,
        itemField: "roleId",
        itemIds: roleIds,
        buildData: (roleId) => ({ userId: ctx.body.userId, roleId }),
        concurrency: options.maxBatchWriteConcurrency,
      })

      return ctx.json({
        success: true,
        message: `Assigned ${assignedCount} role(s) to user`,
        assignedCount,
        skippedCount,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/bulk-assign-permission-to-roles`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacBulkAssignPermissionToRoles`
 *
 * **client:**
 * `authClient.rbac.bulkAssignPermissionToRoles`
 */
export const rbacBulkAssignPermissionToRoles = <O extends RBACPluginOptions>(
  options: O,
) => {
  return createAuthEndpoint(
    "/rbac/bulk-assign-permission-to-roles",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        permissionId: z.string().meta({
          description: "The id of the permission to assign.",
          example: "permission_2nQxLvK8",
        }),
        roleIds: z.array(z.string()).meta({
          description: "The ids of the roles to assign the permission to.",
          example: ["role_8xKdMqQ2", "role_7jOpYz83"],
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkAssignPermissionToRoles",
          summary: "Assign a permission to multiple roles",
          description:
            "Assign a permission to multiple roles in a single call. Roles that already have the permission are skipped.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    permissionId: {
                      type: "string",
                      description: "The id of the permission to assign.",
                      example: "permission_2nQxLvK8",
                    },
                    roleIds: {
                      type: "array",
                      description: "The ids of the roles to assign the permission to.",
                      items: { type: "string" },
                      example: ["role_8xKdMqQ2", "role_7jOpYz83"],
                    },
                  },
                  required: ["permissionId", "roleIds"],
                },
              },
            },
          },
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description:
                          "Human-readable summary of the result. `Permission assigned to N role(s)` when the batch was processed, `No roles provided` when the `roleIds` array was empty.",
                        example: "Permission assigned to 2 role(s)",
                      },
                      assignedCount: {
                        type: "number",
                        description: "Number of roles the permission was assigned to.",
                        example: 2,
                      },
                      skippedCount: {
                        type: "number",
                        description: "Number of roles that already had the permission.",
                        example: 1,
                      },
                    },
                  },
                  examples: {
                    assigned: {
                      summary: "Permission assigned to roles",
                      value: {
                        success: true,
                        message: "Permission assigned to 2 role(s)",
                        assignedCount: 2,
                        skippedCount: 1,
                      },
                    },
                    noRolesAssigned: {
                      summary: "No roles in batch",
                      value: {
                        success: true,
                        message: "No roles provided",
                        assignedCount: 0,
                        skippedCount: 0,
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Batch size cap was exceeded or a target role is a system entity",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["BATCH_TOO_LARGE", "CANNOT_MODIFY_SYSTEM_ROLE"],
                        description: "The error code.",
                        example: "BATCH_TOO_LARGE",
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.BATCH_TOO_LARGE.message,
                          RBAC_ERROR_CODES.CANNOT_MODIFY_SYSTEM_ROLE.message,
                        ],
                        description:
                          "Human-readable error message. `Too many ids provided in a single request.` when the batch cap was exceeded, `Cannot modify system role.` when a target role is a system entity and cannot be modified.",
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
                    cannotModifySystemRole: {
                      summary: "Cannot modify system role.",
                      value: {
                        code: "CANNOT_MODIFY_SYSTEM_ROLE",
                        message: "Cannot modify system role.",
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
                          "Human-readable error message. `Role not found.` when at least one role does not exist, `Permission not found.` when the permission does not exist.",
                        example: "Role not found.",
                      },
                    },
                  },
                  examples: {
                    roleNotFound: {
                      summary: "Role not found.",
                      value: {
                        code: "ROLE_NOT_FOUND",
                        message: "Role not found.",
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
          },
        },
      },
    },
    async (ctx) => {
      if (options.disabledEndpoints?.includes("bulkAssignPermissionToRoles")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

      // Check if permission exists (before the empty-array short-circuit so invalid
      // targets never look like a successful no-op)
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

      if (ctx.body.roleIds.length === 0) {
        return ctx.json({
          success: true,
          message: "No roles provided",
          assignedCount: 0,
          skippedCount: 0,
        })
      }

      const roleIds = normalizeIdBatch(ctx.body.roleIds, options, "roleIds")

      // Validate all target roles exist and are not system entities (single
      // batched query so invalid targets never look like a successful no-op)
      const roles = await ctx.context.adapter.findMany<Role>({
        model: "role",
        where: [{ field: "id", operator: "in", value: roleIds }],
      })

      if (roles.length !== roleIds.length) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      roles.forEach(assertRoleModifiable)

      const { assignedCount, skippedCount } = await assignBatch({
        adapter: ctx.context.adapter,
        model: "rolePermission",
        targetField: "permissionId",
        targetValue: ctx.body.permissionId,
        itemField: "roleId",
        itemIds: roleIds,
        buildData: (roleId) => ({
          roleId,
          permissionId: ctx.body.permissionId,
        }),
        concurrency: options.maxBatchWriteConcurrency,
      })

      return ctx.json({
        success: true,
        message: `Permission assigned to ${assignedCount} role(s)`,
        assignedCount,
        skippedCount,
      })
    },
  )
}
