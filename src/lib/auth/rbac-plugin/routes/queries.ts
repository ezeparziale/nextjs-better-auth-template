import { APIError, createAuthEndpoint } from "better-auth/api"
import * as z from "zod"
import { ensureUserIsAdmin, rbacMiddleware } from "../call"
import { RBAC_ERROR_CODES } from "../error-codes"
import { userHasPermissionKey } from "../permission-check"
import type { RBACPluginOptions, User } from "../types"

/**
 * ### Endpoint
 *
 * POST `/rbac/check-permission`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacCheckPermission`
 *
 * **client:**
 * `authClient.rbac.checkPermission`
 */
export const rbacCheckPermission = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/check-permission",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        userId: z.string().meta({
          description: "The id of the user.",
          example: "user_9mQGfY2Z",
        }),
        permissionKey: z.string().meta({
          description: "The key of the permission to check.",
          example: "post:create",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.checkPermission",
          summary: "Check if a user has a specific permission",
          description: "Check if a user has a specific permission through their roles",
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
                    permissionKey: {
                      type: "string",
                      description: "The key of the permission to check.",
                      example: "post:create",
                    },
                  },
                  required: ["userId", "permissionKey"],
                },
              },
            },
          },
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
                        description:
                          "Whether the user has the permission through an active assigned role.",
                        example: true,
                      },
                    },
                  },
                  examples: {
                    granted: {
                      summary: "Permission granted",
                      value: { hasPermission: true },
                    },
                    denied: {
                      summary: "Permission denied",
                      value: { hasPermission: false },
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
                          "[body.userId] Invalid input: expected string, received undefined",
                      },
                    },
                  },
                  examples: {
                    validationError: {
                      summary: "Invalid request body",
                      value: {
                        code: "VALIDATION_ERROR",
                        message:
                          "[body.userId] Invalid input: expected string, received undefined",
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
      if (options.disabledEndpoints?.includes("checkPermission")) {
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

      // A banned user has no access
      if (user.banned) {
        return ctx.json({
          hasPermission: false,
        })
      }

      const hasPermission = await userHasPermissionKey(
        ctx.context.adapter,
        ctx.body.userId,
        ctx.body.permissionKey,
      )

      return ctx.json({
        hasPermission,
      })
    },
  )
}

/**
 * ### Endpoint
 *
 * POST `/rbac/has-permission`
 *
 * ### API Methods
 *
 * **server:**
 * `auth.api.rbacHasPermission`
 *
 * **client:**
 * `authClient.rbac.hasPermission`
 */
export const rbacHasPermission = <O extends RBACPluginOptions>(options: O) => {
  return createAuthEndpoint(
    "/rbac/has-permission",
    {
      method: "POST",
      use: [rbacMiddleware],
      body: z.object({
        permissionKey: z.string().meta({
          description: "The key of the permission to check.",
          example: "post:create",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.hasPermission",
          summary: "Check if the current user has a specific permission",
          description:
            "Check if the authenticated user has a specific permission through their roles",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    permissionKey: {
                      type: "string",
                      description: "The key of the permission to check.",
                      example: "post:create",
                    },
                  },
                  required: ["permissionKey"],
                },
              },
            },
          },
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
                        description:
                          "Whether the user has the permission through an active assigned role.",
                        example: true,
                      },
                    },
                  },
                  examples: {
                    granted: {
                      summary: "Permission granted",
                      value: { hasPermission: true },
                    },
                    denied: {
                      summary: "Permission denied",
                      value: { hasPermission: false },
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
                          "[body.permissionKey] Invalid input: expected string, received undefined",
                      },
                    },
                  },
                  examples: {
                    validationError: {
                      summary: "Invalid request body",
                      value: {
                        code: "VALIDATION_ERROR",
                        message:
                          "[body.permissionKey] Invalid input: expected string, received undefined",
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
      if (options.disabledEndpoints?.includes("hasPermission")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      // Fetch the current user to check status (e.g. banned)
      const user = await ctx.context.adapter.findOne<User>({
        model: "user",
        where: [
          {
            field: "id",
            value: session.user.id,
          },
        ],
      })

      if (!user) {
        throw APIError.from("NOT_FOUND", RBAC_ERROR_CODES.USER_NOT_FOUND)
      }

      // A banned user has no access
      if (user.banned) {
        return ctx.json({
          hasPermission: false,
        })
      }

      const hasPermission = await userHasPermissionKey(
        ctx.context.adapter,
        session.user.id,
        ctx.body.permissionKey,
      )

      return ctx.json({
        hasPermission,
      })
    },
  )
}
