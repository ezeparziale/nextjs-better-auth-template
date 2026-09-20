import type { DBTransactionAdapter } from "better-auth"
import { APIError, createAuthEndpoint } from "better-auth/api"
import * as z from "zod"
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
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                          RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message,
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
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                          RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message,
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
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.USER_NOT_FOUND.message,
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description: "Human-readable summary of the result.",
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

      // Assign all users within a transaction so a mid-way failure rolls everything back.
      // Falls back to sequential execution when the adapter has no transactions.
      const assignUsers = async (db: DBTransactionAdapter) => {
        let assignedCount = 0
        let skippedCount = 0

        for (const userId of userIds) {
          // Skip if assignment already exists
          const existingAssignment = await db.findOne<UserRole>({
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
          try {
            await db.create<UserRoleCreateInput, UserRole>({
              model: "userRole",
              data: {
                userId,
                roleId: ctx.body.roleId,
              },
            })

            assignedCount++
          } catch (error) {
            // Concurrent request may have created the assignment between check and create
            const existingAssignment = await db.findOne<UserRole>({
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

            if (!existingAssignment) {
              throw error
            }

            skippedCount++
          }
        }

        return { assignedCount, skippedCount }
      }

      const { assignedCount, skippedCount } =
        typeof ctx.context.adapter.transaction === "function"
          ? await ctx.context.adapter.transaction(assignUsers)
          : await assignUsers(ctx.context.adapter)

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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description: "Human-readable summary of the result.",
                        example: "Role removed from 2 user(s)",
                      },
                      removedCount: {
                        type: "number",
                        description: "Number of users the role was removed from.",
                        example: 2,
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
              description: "Role or user not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["ROLE_NOT_FOUND", "USER_NOT_FOUND"],
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                          RBAC_ERROR_CODES.USER_NOT_FOUND.message,
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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description: "Human-readable summary of the result.",
                        example: "Assigned 3 permission(s) to role",
                      },
                      assignedCount: {
                        type: "number",
                        description: "Number of permissions assigned to the role.",
                        example: 3,
                      },
                      skippedCount: {
                        type: "number",
                        description:
                          "Number of permissions already assigned to the role.",
                        example: 1,
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
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                          RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message,
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

      // Assign all permissions within a transaction so a mid-way failure rolls everything back.
      // Falls back to sequential execution when the adapter has no transactions.
      const assignPermissions = async (db: DBTransactionAdapter) => {
        let assignedCount = 0
        let skippedCount = 0

        for (const permissionId of permissionIds) {
          // Skip if assignment already exists
          const existingAssignment = await db.findOne<RolePermission>({
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
          try {
            await db.create<RolePermissionCreateInput, RolePermission>({
              model: "rolePermission",
              data: {
                roleId: ctx.body.roleId,
                permissionId,
              },
            })

            assignedCount++
          } catch (error) {
            // Concurrent request may have created the assignment between check and create
            const existingAssignment = await db.findOne<RolePermission>({
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

            if (!existingAssignment) {
              throw error
            }

            skippedCount++
          }
        }

        return { assignedCount, skippedCount }
      }

      const { assignedCount, skippedCount } =
        typeof ctx.context.adapter.transaction === "function"
          ? await ctx.context.adapter.transaction(assignPermissions)
          : await assignPermissions(ctx.context.adapter)

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
                        description: "Whether the operation succeeded.",
                        example: true,
                      },
                      message: {
                        type: "string",
                        description: "Human-readable summary of the result.",
                        example: "Removed 3 permission(s) from role",
                      },
                      removedCount: {
                        type: "number",
                        description: "Number of permissions removed from the role.",
                        example: 3,
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
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
                          RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message,
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
        }),
        roleIds: z.array(z.string()).meta({
          description: "The ids of the roles to remove.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkRemoveRolesFromUser",
          summary: "Remove multiple roles from a user",
          description: "Remove multiple roles from a user in a single call.",
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
                        description: "Human-readable summary of the result.",
                        example: "Removed 2 role(s) from user",
                      },
                      removedCount: {
                        type: "number",
                        description: "Number of roles removed from the user.",
                        example: 2,
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
        }),
        roleIds: z.array(z.string()).meta({
          description: "The ids of the roles to remove.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkRemoveRolesFromPermission",
          summary: "Remove multiple roles from a permission",
          description: "Remove multiple roles from a permission in a single call.",
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
                        description: "Human-readable summary of the result.",
                        example: "Removed 2 role(s) from permission",
                      },
                      removedCount: {
                        type: "number",
                        description: "Number of roles removed from the permission.",
                        example: 2,
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
                      message: {
                        type: "string",
                        enum: [RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message],
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
        }),
        roleIds: z.array(z.string()).meta({
          description: "The ids of the roles to assign.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkAssignRolesToUser",
          summary: "Assign multiple roles to a user",
          description:
            "Assign multiple roles to a user in a single call. Roles already assigned to the user are skipped.",
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
                        description: "Human-readable summary of the result.",
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

      // Assign all roles within a transaction so a mid-way failure rolls everything back.
      // Falls back to sequential execution when the adapter has no transactions.
      const assignRoles = async (db: DBTransactionAdapter) => {
        let assignedCount = 0
        let skippedCount = 0

        for (const roleId of roleIds) {
          // Skip if assignment already exists
          const existingAssignment = await db.findOne<UserRole>({
            model: "userRole",
            where: [
              {
                field: "userId",
                value: ctx.body.userId,
              },
              {
                field: "roleId",
                value: roleId,
              },
            ],
          })

          if (existingAssignment) {
            skippedCount++
            continue
          }

          // Create assignment
          try {
            await db.create<UserRoleCreateInput, UserRole>({
              model: "userRole",
              data: {
                userId: ctx.body.userId,
                roleId,
              },
            })

            assignedCount++
          } catch (error) {
            // Concurrent request may have created the assignment between check and create
            const existingAssignment = await db.findOne<UserRole>({
              model: "userRole",
              where: [
                {
                  field: "userId",
                  value: ctx.body.userId,
                },
                {
                  field: "roleId",
                  value: roleId,
                },
              ],
            })

            if (!existingAssignment) {
              throw error
            }

            skippedCount++
          }
        }

        return { assignedCount, skippedCount }
      }

      const { assignedCount, skippedCount } =
        typeof ctx.context.adapter.transaction === "function"
          ? await ctx.context.adapter.transaction(assignRoles)
          : await assignRoles(ctx.context.adapter)

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
        }),
        roleIds: z.array(z.string()).meta({
          description: "The ids of the roles to assign the permission to.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.bulkAssignPermissionToRoles",
          summary: "Assign a permission to multiple roles",
          description:
            "Assign a permission to multiple roles in a single call. Roles that already have the permission are skipped.",
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
                        description: "Human-readable summary of the result.",
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
              description: "Permission or role not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        enum: ["PERMISSION_NOT_FOUND", "ROLE_NOT_FOUND"],
                      },
                      message: {
                        type: "string",
                        enum: [
                          RBAC_ERROR_CODES.PERMISSION_NOT_FOUND.message,
                          RBAC_ERROR_CODES.ROLE_NOT_FOUND.message,
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

      // Validate all roles exist (single batched query)
      const missingRoleIds = await findMissingIds(ctx.context.adapter, "role", roleIds)

      if (missingRoleIds.length > 0) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.ROLE_NOT_FOUND)
      }

      // Assign the permission to all roles within a transaction so a mid-way
      // failure rolls everything back. Falls back to sequential execution when
      // the adapter has no transactions.
      const assignRoles = async (db: DBTransactionAdapter) => {
        let assignedCount = 0
        let skippedCount = 0

        for (const roleId of roleIds) {
          // Skip if assignment already exists
          const existingAssignment = await db.findOne<RolePermission>({
            model: "rolePermission",
            where: [
              {
                field: "roleId",
                value: roleId,
              },
              {
                field: "permissionId",
                value: ctx.body.permissionId,
              },
            ],
          })

          if (existingAssignment) {
            skippedCount++
            continue
          }

          // Create assignment
          try {
            await db.create<RolePermissionCreateInput, RolePermission>({
              model: "rolePermission",
              data: {
                roleId,
                permissionId: ctx.body.permissionId,
              },
            })

            assignedCount++
          } catch (error) {
            // Concurrent request may have created the assignment between check and create
            const existingAssignment = await db.findOne<RolePermission>({
              model: "rolePermission",
              where: [
                {
                  field: "roleId",
                  value: roleId,
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

            skippedCount++
          }
        }

        return { assignedCount, skippedCount }
      }

      const { assignedCount, skippedCount } =
        typeof ctx.context.adapter.transaction === "function"
          ? await ctx.context.adapter.transaction(assignRoles)
          : await assignRoles(ctx.context.adapter)

      return ctx.json({
        success: true,
        message: `Permission assigned to ${assignedCount} role(s)`,
        assignedCount,
        skippedCount,
      })
    },
  )
}
