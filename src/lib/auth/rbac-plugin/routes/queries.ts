import { APIError, createAuthEndpoint } from "better-auth/api"
import * as z from "zod"
import { ensureUserIsAdmin, rbacMiddleware } from "../call"
import type { Permission, RBACPluginOptions, RolePermission, UserRole } from "../types"

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
        }),
        permissionKey: z.string().meta({
          description: "The key of the permission to check.",
        }),
      }),
      metadata: {
        openapi: {
          operationId: "rbac.checkPermission",
          summary: "Check if a user has a specific permission",
          description: "Check if a user has a specific permission through their roles",
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
      if (options.disabledEndpoints?.includes("checkPermission")) {
        throw new APIError("NOT_FOUND")
      }

      const session = ctx.context.session

      ensureUserIsAdmin(session)

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
      if (options.disabledEndpoints?.includes("hasPermission")) {
        throw new APIError("NOT_FOUND")
      }

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
  )
}
