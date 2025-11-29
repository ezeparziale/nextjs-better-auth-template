import {
  BASE_ERROR_CODES,
  Where,
  type BetterAuthPlugin,
  type Session,
} from "better-auth"
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
      listUsersAdvanced: createAuthEndpoint(
        "/admin-plus/list-users",
        {
          method: "GET",
          use: [adminPlusMiddleware],
          query: z.object({
            searchValue: z.string().optional().meta({
              description: 'The value to search for. Eg: "some name"',
            }),
            searchField: z
              .enum(["email", "name"])
              .meta({
                description:
                  'The field to search in, defaults to email. Can be `email` or `name`. Eg: "name"',
              })
              .optional(),
            searchOperator: z
              .enum(["contains", "starts_with", "ends_with"])
              .meta({
                description:
                  'The operator to use for the search. Can be `contains`, `starts_with` or `ends_with`. Eg: "contains"',
              })
              .optional(),
            limit: z
              .string()
              .meta({
                description: "The number of users to return",
              })
              .or(z.number())
              .optional(),
            offset: z
              .string()
              .meta({
                description: "The offset to start from",
              })
              .or(z.number())
              .optional(),
            sortBy: z
              .string()
              .meta({
                description: "The field to sort by",
              })
              .optional(),
            sortDirection: z
              .enum(["asc", "desc"])
              .meta({
                description: "The direction to sort by",
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
              operationId: "listUsersAdvanced",
              summary: "List users",
              description: "List users",
              responses: {
                200: {
                  description: "List of users",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
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
                        required: ["users", "total"],
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

          const where: Where[] = []

          if (ctx.query?.searchValue) {
            where.push({
              field: ctx.query.searchField || "email",
              operator: ctx.query.searchOperator || "contains",
              value: ctx.query.searchValue,
            })
          }

          if (ctx.query.filters) {
            try {
              const filters = JSON.parse(ctx.query.filters) as Where[]
              for (const filter of filters) {
                let filterValue = filter.value as
                  | string
                  | number
                  | boolean
                  | string[]
                  | number[]
                  | boolean[]
                  | undefined

                if (filter.operator === "in") {
                  try {
                    if (typeof filterValue === "string") {
                      if (filterValue.startsWith("[")) {
                        filterValue = JSON.parse(filterValue)
                      } else {
                        filterValue = filterValue.split(",").map((v) => v.trim())
                      }
                    }
                  } catch {
                    if (typeof filterValue === "string") {
                      filterValue = filterValue.split(",").map((v) => v.trim())
                    }
                  }
                  if (!Array.isArray(filterValue)) {
                    throw new APIError("BAD_REQUEST", {
                      message: "Value must be an array",
                    })
                  }
                  const boolValues: boolean[] = []
                  let isAllBooleans = true
                  for (const v of filterValue) {
                    if (v === "true" || v === true) {
                      boolValues.push(true)
                    } else if (v === "false" || v === false) {
                      boolValues.push(false)
                    } else {
                      isAllBooleans = false
                      break
                    }
                  }

                  if (isAllBooleans) {
                    if (boolValues.includes(true) && boolValues.includes(false)) {
                      continue
                    }
                    filterValue = boolValues
                  }
                } else if (filterValue === "true") {
                  filterValue = true
                } else if (filterValue === "false") {
                  filterValue = false
                }

                if (filterValue !== undefined) {
                  where.push({
                    field: filter.field,
                    operator: filter.operator || "eq",
                    value: filterValue as unknown as string[],
                  })
                }
              }
            } catch {
              throw new APIError("BAD_REQUEST", {
                message: "Invalid filters format",
              })
            }
          }

          try {
            const users = await ctx.context.internalAdapter.listUsers(
              Number(ctx.query?.limit) || undefined,
              Number(ctx.query?.offset) || undefined,
              ctx.query?.sortBy
                ? {
                    field: ctx.query.sortBy,
                    direction: ctx.query.sortDirection || "asc",
                  }
                : undefined,
              where.length ? where : undefined,
            )
            const total = await ctx.context.internalAdapter.countTotalUsers(
              where.length ? where : undefined,
            )
            return ctx.json({
              users: users as UserWithRole[],
              total: total,
              limit: Number(ctx.query?.limit) || undefined,
              offset: Number(ctx.query?.offset) || undefined,
            })
          } catch {
            return ctx.json({
              users: [],
              total: 0,
            })
          }
        },
      ),
    },
  } satisfies BetterAuthPlugin
}
