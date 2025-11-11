import { BASE_ERROR_CODES, type BetterAuthPlugin, type Session } from "better-auth"
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api"
import { UserWithRole } from "better-auth/plugins/admin"
import * as z from "zod"
import { ADMIN_PLUS_ERROR_CODES } from "./error-codes"

export const adminPlusPlugin = () => {
  /**
   * Ensures a valid session, if not will throw.
   * Will also provide additional types on the user to include role types.
   */
  const adminPlusMiddleware = createAuthMiddleware(async (ctx) => {
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

  /**
   * Ensures the user has the "admin" role, otherwise throws a "FORBIDDEN" error.
   */
  const ensureUserIsAdmin = (session: { user: { role?: string | null } }) => {
    const roles = session.user.role?.split(",").map((role) => role.trim()) || []
    if (!roles.includes("admin")) {
      throw new APIError("FORBIDDEN")
    }
  }

  return {
    id: "admin-plus-plugin",
    endpoints: {
      /**
       * ### Endpoint
       *
       * POST `/admin-plus/remove-password`
       *
       * ### API Methods
       *
       * **server:**
       * `auth.api.adminPlusRemovePassword`
       *
       * **client:**
       * `authClient.adminPlus.removePassword`
       *
       * ### Description
       *
       * Removes the password authentication method for a specific user.
       * This endpoint deletes the credential account associated with the user,
       * effectively removing their ability to login with a password.
       * Only administrators can perform this action.
       */
      adminPlusRemovePassword: createAuthEndpoint(
        "/admin-plus/remove-password",
        {
          method: "POST",
          use: [adminPlusMiddleware],
          body: z.object({
            userId: z.string().meta({
              description: "The id of the user.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "adminPlus.removePassword",
              summary: "Remove password authentication for a user",
              description:
                "Removes the credential account (password) for a specified user. Requires admin role. If the user doesn't have a password set, the operation succeeds without changes.",
              responses: {
                200: {
                  description: "Password removed successfully",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          success: {
                            type: "boolean",
                            description: "Indicates if the operation was successful",
                          },
                        },
                      },
                    },
                  },
                },
                401: {
                  description: "Unauthorized - No valid session",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          code: {
                            type: "string",
                            enum: ["UNAUTHORIZED"],
                          },
                          error: {
                            type: "string",
                          },
                        },
                      },
                    },
                  },
                },
                403: {
                  description: "Forbidden - User is not an admin",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          code: {
                            type: "string",
                            enum: ["FORBIDDEN"],
                          },
                          error: {
                            type: "string",
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
                            enum: [ADMIN_PLUS_ERROR_CODES.USER_NOT_FOUND],
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

          ensureUserIsAdmin(session)

          // Find user
          const user = await ctx.context.adapter.findOne<UserWithRole>({
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
              message: ADMIN_PLUS_ERROR_CODES.USER_NOT_FOUND,
            })
          }

          // Check if user has credential provider
          const accounts = await ctx.context.internalAdapter.findAccountByUserId(
            user.id,
          )
          const account = accounts.find(
            (account) => account.providerId === "credential",
          )

          if (!account) {
            return ctx.json({ success: true })
          }

          await ctx.context.internalAdapter.deleteAccount(account.id)

          return ctx.json({ success: true })
        },
      ),
      /**
       * ### Endpoint
       *
       * POST `/admin-plus/user-has-credential-account`
       *
       * ### API Methods
       *
       * **server:**
       * `auth.api.userHasCredentialAccount`
       *
       * **client:**
       * `authClient.adminPlus.userHasCredentialAccount`
       *
       * ### Description
       *
       * Checks if a user has a credential account (password authentication).
       * Returns true if the user has a password set, false otherwise.
       * Only administrators can perform this action.
       */
      userHasCredentialAccount: createAuthEndpoint(
        "/admin-plus/user-has-credential-account",
        {
          method: "POST",
          use: [adminPlusMiddleware],
          body: z.object({
            userId: z.string().meta({
              description: "The id of the user to check.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "adminPlus.userHasCredentialAccount",
              summary: "Check if user has password authentication",
              description:
                "Checks whether a specified user has a credential account (password) configured. Requires admin role.",
              responses: {
                200: {
                  description: "Successfully checked credential account status",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          hasCredentialAccount: {
                            type: "boolean",
                            description:
                              "True if the user has a password set, false otherwise",
                          },
                        },
                      },
                    },
                  },
                },
                401: {
                  description: "Unauthorized - No valid session",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          code: {
                            type: "string",
                            enum: ["UNAUTHORIZED"],
                          },
                          error: {
                            type: "string",
                          },
                        },
                      },
                    },
                  },
                },
                403: {
                  description: "Forbidden - User is not an admin",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          code: {
                            type: "string",
                            enum: ["FORBIDDEN"],
                          },
                          error: {
                            type: "string",
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
                            enum: [ADMIN_PLUS_ERROR_CODES.USER_NOT_FOUND],
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

          ensureUserIsAdmin(session)

          // Find user
          const user = await ctx.context.adapter.findOne<UserWithRole>({
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
              message: ADMIN_PLUS_ERROR_CODES.USER_NOT_FOUND,
            })
          }

          // Check if user has credential provider
          const accounts = await ctx.context.internalAdapter.findAccountByUserId(
            user.id,
          )
          const account = accounts.find(
            (account) => account.providerId === "credential",
          )

          return ctx.json({ hasCredentialAccount: !!account })
        },
      ),
      /**
       * ### Endpoint
       *
       * POST `/admin-plus/set-credential-password`
       *
       * ### API Methods
       *
       * **server:**
       * `auth.api.setCredentialPassword`
       *
       * **client:**
       * `authClient.adminPlus.setCredentialPassword`
       *
       * ### Description
       *
       * Sets or updates the password for a user's credential account.
       * Creates a new credential account if the user doesn't have one,
       * or updates the existing password if they do.
       * Only administrators can perform this action.
       */
      setCredentialPassword: createAuthEndpoint(
        "/admin-plus/set-credential-password",
        {
          method: "POST",
          use: [adminPlusMiddleware],
          body: z.object({
            userId: z.string().meta({
              description: "The id of the user.",
            }),
            newPassword: z.string().min(1).meta({
              description: "The new password for the user.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "adminPlus.setCredentialPassword",
              summary: "Set or update user password",
              description:
                "Sets or updates the password for a specified user's credential account. Creates a new credential account if one doesn't exist. Requires admin role.",
              responses: {
                200: {
                  description: "Password set successfully",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          success: {
                            type: "boolean",
                            description: "Indicates if the operation was successful",
                          },
                        },
                      },
                    },
                  },
                },
                401: {
                  description: "Unauthorized - No valid session",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          code: {
                            type: "string",
                            enum: ["UNAUTHORIZED"],
                          },
                          error: {
                            type: "string",
                          },
                        },
                      },
                    },
                  },
                },
                403: {
                  description: "Forbidden - User is not an admin",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          code: {
                            type: "string",
                            enum: ["FORBIDDEN"],
                          },
                          error: {
                            type: "string",
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
                            enum: [ADMIN_PLUS_ERROR_CODES.USER_NOT_FOUND],
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

          ensureUserIsAdmin(session)

          const { newPassword, userId } = ctx.body

          // Find user
          const user = await ctx.context.adapter.findOne<UserWithRole>({
            model: "user",
            where: [
              {
                field: "id",
                value: userId,
              },
            ],
          })

          if (!user) {
            throw new APIError("NOT_FOUND", {
              message: ADMIN_PLUS_ERROR_CODES.USER_NOT_FOUND,
            })
          }

          // Check length password
          const minPasswordLength = ctx.context.password.config.minPasswordLength
          if (newPassword.length < minPasswordLength) {
            ctx.context.logger.error("Password is too short")
            throw new APIError("BAD_REQUEST", {
              message: BASE_ERROR_CODES.PASSWORD_TOO_SHORT,
            })
          }
          const maxPasswordLength = ctx.context.password.config.maxPasswordLength
          if (newPassword.length > maxPasswordLength) {
            ctx.context.logger.error("Password is too long")
            throw new APIError("BAD_REQUEST", {
              message: BASE_ERROR_CODES.PASSWORD_TOO_LONG,
            })
          }

          // Check if user has existing credential account
          const accounts = await ctx.context.internalAdapter.findAccountByUserId(
            user.id,
          )
          const existingAccount = accounts.find(
            (account) => account.providerId === "credential",
          )

          const hashedPassword = await ctx.context.password.hash(newPassword)

          if (existingAccount) {
            // Update existing credential account
            await ctx.context.internalAdapter.updateAccount(existingAccount.id, {
              password: hashedPassword,
            })
          } else {
            // Create new credential account
            await ctx.context.internalAdapter.linkAccount({
              accountId: user.id,
              providerId: "credential",
              password: hashedPassword,
              userId: user.id,
            })
          }

          await ctx.context.internalAdapter.deleteSessions(user.id)

          return ctx.json({ success: true })
        },
      ),
    },
  } satisfies BetterAuthPlugin
}
