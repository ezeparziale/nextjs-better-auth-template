import { randomUUID } from "crypto"
import { type BetterAuthPlugin, type Session, type Where } from "better-auth"
import {
  APIError,
  createAuthEndpoint,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api"
import { UserWithRole } from "better-auth/plugins/admin"
import * as z from "zod"
import {
  INVITATION_ERROR_GENERIC_MESSAGE,
  INVITATION_EXPIRED_MESSAGE,
  INVITATION_EXPIRES_IN_DAYS,
  INVITATION_HEADER,
} from "./constants"
import { INVITATION_ERROR_CODES } from "./error-codes"
import { schema } from "./schema"
import type { Invitation } from "./types"

const INVITATION_STATUSES = ["pending", "accepted", "revoked", "expired"] as const

export type InvitationPluginOptions = {
  expiresInDays?: number
}

export const invitationPlugin = (options?: InvitationPluginOptions) => {
  const defaultExpiresInDays = options?.expiresInDays ?? INVITATION_EXPIRES_IN_DAYS
  const invitationMiddleware = createAuthMiddleware(async (ctx) => {
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

  const ensureUserIsAdmin = (session: { user: { role?: string | null } }) => {
    const roles = session.user.role?.split(",").map((role) => role.trim()) || []
    if (!roles.includes("admin")) {
      throw new APIError("FORBIDDEN")
    }
  }

  return {
    id: "invitation-plugin",
    schema,
    rateLimit: [
      {
        pathMatcher: (path) => path === "/invitation/create",
        window: 60,
        max: 10,
      },
      {
        pathMatcher: (path) => path === "/invitation/resend",
        window: 60,
        max: 5,
      },
    ],
    hooks: {
      before: [
        {
          matcher: (context) => context.path === "/sign-up/email",
          handler: createAuthMiddleware(async (ctx) => {
            const token = ctx.headers?.get(INVITATION_HEADER)
            if (!token) {
              return
            }

            const email = (ctx.body?.email as string | undefined)?.toLowerCase().trim()
            if (!email) {
              return
            }

            const invitation = await ctx.context.adapter.findOne<Invitation>({
              model: "invitation",
              where: [{ field: "token", value: token }],
            })

            if (
              !invitation ||
              invitation.status !== "pending" ||
              email !== invitation.email.toLowerCase()
            ) {
              throw new APIError("BAD_REQUEST", {
                message: INVITATION_ERROR_GENERIC_MESSAGE,
              })
            }

            if (invitation.expiresAt < new Date()) {
              throw new APIError("BAD_REQUEST", {
                message: INVITATION_EXPIRED_MESSAGE,
              })
            }
          }),
        },
      ],
      after: [
        {
          matcher: (context) => context.path === "/sign-up/email",
          handler: createAuthMiddleware(async (ctx) => {
            const token = ctx.headers?.get(INVITATION_HEADER)
            if (!token) {
              return
            }

            const email = (ctx.body?.email as string | undefined)?.toLowerCase().trim()
            if (!email) {
              return
            }

            const invitation = await ctx.context.adapter.findOne<Invitation>({
              model: "invitation",
              where: [{ field: "token", value: token }],
            })
            if (!invitation) {
              return
            }

            const user = await ctx.context.adapter.findOne<{ id: string }>({
              model: "user",
              where: [{ field: "email", value: email }],
            })
            if (!user) {
              return
            }

            await ctx.context.adapter.update<Invitation>({
              model: "invitation",
              where: [{ field: "id", value: invitation.id }],
              update: {
                status: "accepted",
                acceptedAt: new Date(),
                userId: user.id,
              },
            })
          }),
        },
      ],
    },
    endpoints: {
      invitationCreate: createAuthEndpoint(
        "/invitation/create",
        {
          method: "POST",
          use: [invitationMiddleware],
          body: z.object({
            email: z.email("Invalid email address").meta({
              description: "The email of the user to invite.",
            }),
            expiresInDays: z
              .number()
              .int()
              .positive()
              .default(defaultExpiresInDays)
              .optional()
              .meta({
                description:
                  "Number of days the invitation will be valid for. Defaults to the plugin config.",
              }),
          }),
          metadata: {
            openapi: {
              operationId: "invitation.create",
              summary: "Create an invitation",
              description:
                "Creates an invitation for a user. Sends an email with the acceptance link. Requires admin role.",
              responses: {
                200: {
                  description: "Invitation created",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          invitation: { type: "object" },
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

          const { email } = ctx.body
          const expiresInDays = ctx.body.expiresInDays ?? defaultExpiresInDays
          const normalizedEmail = email.toLowerCase().trim()

          // Check the email doesn't already belong to an existing user
          const existingUser = await ctx.context.adapter.findOne<UserWithRole>({
            model: "user",
            where: [{ field: "email", value: normalizedEmail }],
          })
          if (existingUser) {
            throw APIError.from(
              "BAD_REQUEST",
              INVITATION_ERROR_CODES.USER_ALREADY_EXISTS,
            )
          }

          const now = new Date()
          const expiresAt = new Date(
            now.getTime() + expiresInDays * 24 * 60 * 60 * 1000,
          )
          const token = randomUUID()

          // Check there is not an active (pending) invitation for this email.
          // Multiple invitations per email are allowed (kept as history), so look
          // for a pending one specifically.
          const existingInvitations = await ctx.context.adapter.findMany<Invitation>({
            model: "invitation",
            where: [{ field: "email", value: normalizedEmail }],
          })
          const hasPending = existingInvitations.some(
            (inv) => inv.status === "pending" && inv.expiresAt > now,
          )
          if (hasPending) {
            throw APIError.from(
              "BAD_REQUEST",
              INVITATION_ERROR_CODES.INVITATION_ALREADY_EXISTS,
            )
          }

          // Always create a fresh row so previous (e.g. revoked) invitations are
          // kept as history.
          const invitation = await ctx.context.adapter.create<Invitation>({
            model: "invitation",
            data: {
              email: normalizedEmail,
              token,
              status: "pending",
              invitedBy: session.user.email,
              invitedById: session.user.id,
              invitedAt: now,
              expiresAt,
              acceptedAt: null,
              userId: null,
            },
          })

          // Fire-and-forget email send (do not fail the request)
          void (async () => {
            const { sendInvitationEmail } = await import("../../email/send-email")
            await sendInvitationEmail({
              to: normalizedEmail,
              token: invitation.token,
              expiresInDays,
            })
          })()

          return ctx.json({ invitation })
        },
      ),

      invitationList: createAuthEndpoint(
        "/invitation/list",
        {
          method: "GET",
          use: [invitationMiddleware],
          query: z.object({
            searchValue: z.string().optional().meta({
              description: "The value to search by email.",
            }),
            status: z
              .enum(["all", ...INVITATION_STATUSES])
              .optional()
              .default("all")
              .meta({
                description: "Filter by invitation status.",
              }),
            limit: z
              .string()
              .transform((val) => parseInt(val, 10))
              .or(z.number())
              .optional(),
            offset: z
              .string()
              .transform((val) => parseInt(val, 10))
              .or(z.number())
              .optional(),
            sortBy: z.string().optional().meta({
              description: "The field to sort by.",
            }),
            sortDirection: z.enum(["asc", "desc"]).optional().default("desc").meta({
              description: "The direction to sort by.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "invitation.list",
              summary: "List invitations",
              description:
                "List invitations with pagination, search and status filtering. Requires admin role.",
              responses: {
                200: {
                  description: "List of invitations",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          invitations: { type: "array", items: { type: "object" } },
                          total: { type: "number" },
                          limit: { type: "number" },
                          offset: { type: "number" },
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

          const where: Where[] = []

          if (ctx.query.searchValue) {
            where.push({
              field: "email",
              operator: "contains",
              value: ctx.query.searchValue,
            })
          }

          const requestedStatus = ctx.query.status ?? "all"
          const now = new Date()

          const allInvitations = await ctx.context.adapter.findMany<Invitation>({
            model: "invitation",
            where: where.length ? where : undefined,
          })

          // Adapter sortBy can't order by @map'd fields (camelCase columns).
          // Sort in JS instead using a whitelist of sortable fields.
          const sortField = (ctx.query.sortBy ?? "invitedAt") as
            "email" | "status" | "invitedAt"
          const sortDirection = ctx.query.sortDirection === "asc" ? 1 : -1

          allInvitations.sort((a, b) => {
            const aVal = a[sortField]
            const bVal = b[sortField]
            if (aVal == null && bVal == null) return 0
            if (aVal == null) return 1
            if (bVal == null) return -1
            if (aVal < bVal) return -sortDirection
            if (aVal > bVal) return sortDirection
            return 0
          })

          // Compute effective status (expired overrides pending)
          const withStatus = allInvitations.map((inv) => ({
            ...inv,
            effectiveStatus:
              inv.status === "pending" && inv.expiresAt < now ? "expired" : inv.status,
          }))

          const filtered = withStatus.filter(
            (inv) =>
              requestedStatus === "all" || inv.effectiveStatus === requestedStatus,
          )

          const total = filtered.length
          const offset = Number(ctx.query.offset ?? 0)
          const limit = Number(ctx.query.limit ?? 10)
          const invitations = filtered.slice(offset, offset + limit)

          return ctx.json({ invitations, total, limit, offset })
        },
      ),

      invitationRevoke: createAuthEndpoint(
        "/invitation/revoke",
        {
          method: "POST",
          use: [invitationMiddleware],
          body: z.object({
            invitationId: z.string().meta({
              description: "The id of the invitation to revoke.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "invitation.revoke",
              summary: "Revoke an invitation",
              description: "Revokes a pending invitation. Requires admin role.",
              responses: {
                200: {
                  description: "Invitation revoked",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          success: { type: "boolean" },
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

          const invitation = await ctx.context.adapter.findOne<Invitation>({
            model: "invitation",
            where: [{ field: "id", value: ctx.body.invitationId }],
          })

          if (!invitation) {
            throw APIError.from(
              "NOT_FOUND",
              INVITATION_ERROR_CODES.INVITATION_NOT_FOUND,
            )
          }

          if (invitation.status !== "pending") {
            throw APIError.from(
              "BAD_REQUEST",
              INVITATION_ERROR_CODES.INVITATION_ALREADY_USED,
            )
          }

          await ctx.context.adapter.update<Invitation>({
            model: "invitation",
            where: [{ field: "id", value: invitation.id }],
            update: {
              status: "revoked",
            },
          })

          return ctx.json({ success: true })
        },
      ),

      invitationDelete: createAuthEndpoint(
        "/invitation/delete",
        {
          method: "POST",
          use: [invitationMiddleware],
          body: z.object({
            invitationId: z.string().meta({
              description: "The id of the invitation to delete.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "invitation.delete",
              summary: "Delete an invitation",
              description:
                "Deletes a revoked or expired invitation. Pending and accepted invitations cannot be deleted. Requires admin role.",
              responses: {
                200: {
                  description: "Invitation deleted",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          success: { type: "boolean" },
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

          const invitation = await ctx.context.adapter.findOne<Invitation>({
            model: "invitation",
            where: [{ field: "id", value: ctx.body.invitationId }],
          })

          if (!invitation) {
            throw APIError.from(
              "NOT_FOUND",
              INVITATION_ERROR_CODES.INVITATION_NOT_FOUND,
            )
          }

          const isExpired =
            invitation.status === "pending" && invitation.expiresAt < new Date()
          const isDeletableStatus = invitation.status === "revoked" || isExpired

          if (!isDeletableStatus) {
            throw APIError.from(
              "BAD_REQUEST",
              INVITATION_ERROR_CODES.INVITATION_CANNOT_DELETE,
            )
          }

          await ctx.context.adapter.delete<Invitation>({
            model: "invitation",
            where: [{ field: "id", value: invitation.id }],
          })

          return ctx.json({ success: true })
        },
      ),

      invitationResend: createAuthEndpoint(
        "/invitation/resend",
        {
          method: "POST",
          use: [invitationMiddleware],
          body: z.object({
            invitationId: z.string().meta({
              description: "The id of the invitation to resend the email for.",
            }),
          }),
          metadata: {
            openapi: {
              operationId: "invitation.resend",
              summary: "Resend an invitation email",
              description:
                "Re-sends the invitation email for a pending invitation. Only usable while the invitation is still pending. Requires admin role.",
              responses: {
                200: {
                  description: "Invitation email re-sent",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          success: { type: "boolean" },
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

          const invitation = await ctx.context.adapter.findOne<Invitation>({
            model: "invitation",
            where: [{ field: "id", value: ctx.body.invitationId }],
          })

          if (!invitation) {
            throw APIError.from(
              "NOT_FOUND",
              INVITATION_ERROR_CODES.INVITATION_NOT_FOUND,
            )
          }

          if (invitation.status !== "pending") {
            throw APIError.from(
              "BAD_REQUEST",
              INVITATION_ERROR_CODES.INVITATION_ALREADY_USED,
            )
          }

          if (invitation.expiresAt < new Date()) {
            throw APIError.from(
              "BAD_REQUEST",
              INVITATION_ERROR_CODES.INVITATION_EXPIRED,
            )
          }

          const expiresInDays = Math.max(
            1,
            Math.ceil(
              (invitation.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
            ),
          )

          // Fire-and-forget email send (do not fail the request)
          void (async () => {
            const { sendInvitationEmail } = await import("../../email/send-email")
            await sendInvitationEmail({
              to: invitation.email,
              token: invitation.token,
              expiresInDays,
            })
          })()

          return ctx.json({ success: true })
        },
      ),
    },
  } satisfies BetterAuthPlugin
}
