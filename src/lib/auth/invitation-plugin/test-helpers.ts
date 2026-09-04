import { admin } from "better-auth/plugins"
import { getTestInstance } from "better-auth/test"
import { invitationPlugin } from "./index"
import type { Invitation } from "./types"

export const ADMIN_EMAIL = "admin@test.com"
export const ADMIN_PASSWORD = "test123456"
export const DEFAULT_EXPIRES_IN_DAYS = 30

const BASE_URL = "http://localhost:3000"

export async function setupInvitationTest(
  expiresInDays = DEFAULT_EXPIRES_IN_DAYS,
  overrides: Omit<Partial<Parameters<typeof getTestInstance>[0]>, "plugins"> = {},
) {
  const ctx = await getTestInstance(
    {
      plugins: [
        admin(),
        expiresInDays === DEFAULT_EXPIRES_IN_DAYS
          ? invitationPlugin()
          : invitationPlugin({ expiresInDays }),
      ],
      ...overrides,
    },
    { testUser: { email: ADMIN_EMAIL } },
  )

  await ctx.db.update({
    model: "user",
    where: [{ field: "email", value: ADMIN_EMAIL }],
    update: { role: "admin" },
  })

  return ctx
}

export type InvitationTestContext = Awaited<ReturnType<typeof setupInvitationTest>>

export type ListedInvitation = Invitation & { effectiveStatus?: string }

export type InvitationApi = {
  invitationCreate: (input: {
    body: { email: string; expiresInDays?: number }
    headers: Headers
  }) => Promise<{ invitation: Invitation }>
  invitationList: (input: {
    query: {
      searchValue?: string
      status?: string
      limit?: number | string
      offset?: number | string
      sortBy?: string
      sortDirection?: string
    }
    headers: Headers
  }) => Promise<{
    invitations: ListedInvitation[]
    total: number
    limit: number
    offset: number
  }>
  invitationRevoke: (input: {
    body: { invitationId: string }
    headers: Headers
  }) => Promise<{ success: boolean }>
  invitationDelete: (input: {
    body: { invitationId: string }
    headers: Headers
  }) => Promise<{ success: boolean }>
  invitationResend: (input: {
    body: { invitationId: string }
    headers: Headers
  }) => Promise<{ success: boolean }>
}

export const invitationApi = (ctx: InvitationTestContext): InvitationApi =>
  ctx.auth.api as unknown as InvitationApi

export async function runAsAdmin<T>(
  ctx: InvitationTestContext,
  fn: (headers: Headers) => Promise<T>,
): Promise<T> {
  const { headers } = await ctx.signInWithUser(ADMIN_EMAIL, ADMIN_PASSWORD)
  return fn(headers)
}

export async function createInvitation(
  ctx: InvitationTestContext,
  body: { email: string; expiresInDays?: number },
): Promise<Invitation> {
  return runAsAdmin(ctx, async (headers) => {
    const res = await invitationApi(ctx).invitationCreate({ body, headers })
    return res.invitation
  })
}

export async function findInvitation(
  ctx: InvitationTestContext,
  where: { field: string; value: string },
): Promise<Invitation | null> {
  return ctx.db.findOne<Invitation>({
    model: "invitation",
    where: [where],
  })
}

export async function expireInvitation(
  ctx: InvitationTestContext,
  token: string,
): Promise<void> {
  await ctx.db.update({
    model: "invitation",
    where: [{ field: "token", value: token }],
    update: { expiresAt: new Date(Date.now() - 60_000) },
  })
}

export const originHeaders = (token?: string): Headers => {
  const headers = new Headers({ origin: BASE_URL })
  if (token) headers.set("x-invitation-token", token)
  return headers
}
