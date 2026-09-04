import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { sendInvitationEmail } from "../../email/send-email"
import { INVITATION_ERROR_CODES } from "./error-codes"
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  createInvitation,
  expireInvitation,
  findInvitation,
  invitationApi,
  originHeaders,
  runAsAdmin,
  setupInvitationTest,
  type InvitationTestContext,
} from "./test-helpers"

vi.mock("../../email/send-email", () => ({
  sendInvitationEmail: vi.fn(),
}))

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const expectInvitationExpiry = (expiresAt: Date, days: number) => {
  const expected = Date.now() + days * 24 * 60 * 60 * 1000
  expect(Math.abs(expiresAt.getTime() - expected)).toBeLessThan(60_000)
}

describe("invitation-plugin", () => {
  let ctx: InvitationTestContext
  let api: ReturnType<typeof invitationApi>

  beforeAll(async () => {
    ctx = await setupInvitationTest()
    api = invitationApi(ctx)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("authorization", () => {
    it("rejects unauthenticated requests on all endpoints", async () => {
      const headers = originHeaders()
      const calls = [
        api.invitationCreate({ body: { email: "a@test.com" }, headers }),
        api.invitationList({ query: {}, headers }),
        api.invitationRevoke({ body: { invitationId: "x" }, headers }),
        api.invitationDelete({ body: { invitationId: "x" }, headers }),
        api.invitationResend({ body: { invitationId: "x" }, headers }),
      ]

      for (const call of calls) {
        await expect(call).rejects.toMatchObject({ statusCode: 401 })
      }
    })

    it("rejects non-admin sessions with FORBIDDEN", async () => {
      const email = "member@test.com"
      await ctx.auth.api.signUpEmail({
        body: { email, password: ADMIN_PASSWORD, name: "Member" },
      })

      await ctx.runWithUser(email, ADMIN_PASSWORD, async (headers) => {
        await expect(
          api.invitationCreate({ body: { email: "x@test.com" }, headers }),
        ).rejects.toMatchObject({ statusCode: 403 })
      })
    })

    it("rejects sessions without a role with FORBIDDEN", async () => {
      const email = "roleless@test.com"
      await ctx.auth.api.signUpEmail({
        body: { email, password: ADMIN_PASSWORD, name: "Roleless" },
      })
      await ctx.db.update({
        model: "user",
        where: [{ field: "email", value: email }],
        update: { role: null },
      })

      await ctx.runWithUser(email, ADMIN_PASSWORD, async (headers) => {
        await expect(
          api.invitationCreate({ body: { email: "x@test.com" }, headers }),
        ).rejects.toMatchObject({ statusCode: 403 })
      })
    })
  })

  describe("invitation.create", () => {
    it("creates a pending invitation with token, timestamps and invitedBy", async () => {
      const email = "pending@test.com"
      const invitation = await createInvitation(ctx, { email })

      expect(invitation.email).toBe(email)
      expect(invitation.status).toBe("pending")
      expect(invitation.token).toMatch(UUID_V4)
      expect(invitation.invitedBy).toBe(ADMIN_EMAIL)
      expect(invitation.invitedById).toBeTruthy()
      expect(invitation.acceptedAt).toBeNull()
      expect(invitation.userId).toBeNull()
      expectInvitationExpiry(invitation.expiresAt, 30)

      const stored = await findInvitation(ctx, {
        field: "token",
        value: invitation.token,
      })
      expect(stored?.status).toBe("pending")

      await vi.waitFor(() =>
        expect(sendInvitationEmail).toHaveBeenCalledWith({
          to: email,
          token: invitation.token,
          expiresInDays: 30,
        }),
      )
    })

    it("honors a custom expiresInDays", async () => {
      const invitation = await createInvitation(ctx, {
        email: "custom-expiry@test.com",
        expiresInDays: 5,
      })
      expectInvitationExpiry(invitation.expiresAt, 5)
    })

    it("rejects invalid emails", async () => {
      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationCreate({ body: { email: "not-an-email" }, headers }),
        ).rejects.toMatchObject({ statusCode: 400 })
      })
    })

    it("rejects when the email already belongs to a user", async () => {
      const email = "existing@test.com"
      await ctx.auth.api.signUpEmail({
        body: { email, password: ADMIN_PASSWORD, name: "Existing" },
      })

      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationCreate({ body: { email }, headers }),
        ).rejects.toMatchObject({
          statusCode: 400,
          body: { code: INVITATION_ERROR_CODES.USER_ALREADY_EXISTS.code },
        })
      })
    })

    it("rejects a duplicate pending invitation for the same email", async () => {
      const email = "duplicate@test.com"
      await createInvitation(ctx, { email })

      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationCreate({ body: { email }, headers }),
        ).rejects.toMatchObject({
          statusCode: 400,
          body: { code: INVITATION_ERROR_CODES.INVITATION_ALREADY_EXISTS.code },
        })
      })
    })

    it("allows re-inviting once the previous invitation has expired", async () => {
      const email = "reinvite-after-expiry@test.com"
      const first = await createInvitation(ctx, { email })
      await expireInvitation(ctx, first.token)

      const second = await createInvitation(ctx, { email })
      expect(second.token).not.toBe(first.token)
      expect(second.status).toBe("pending")
    })
  })

  describe("invitation.list", () => {
    let listCtx: InvitationTestContext
    let listApi: ReturnType<typeof invitationApi>

    beforeAll(async () => {
      listCtx = await setupInvitationTest()
      listApi = invitationApi(listCtx)
    })

    it("computes effectiveStatus, filters by status and paginates", async () => {
      const revokeEmail = "revoked@test.com"
      const expiredEmail = "expired@test.com"

      const revoked = await createInvitation(listCtx, { email: revokeEmail })
      const expired = await createInvitation(listCtx, { email: expiredEmail })
      await createInvitation(listCtx, { email: "plain@test.com" })

      await runAsAdmin(listCtx, async (headers) => {
        await listApi.invitationRevoke({
          body: { invitationId: revoked.id },
          headers,
        })
      })
      await expireInvitation(listCtx, expired.token)

      await runAsAdmin(listCtx, async (headers) => {
        const all = await listApi.invitationList({ query: {}, headers })
        expect(all.total).toBe(3)
        expect(all.invitations).toHaveLength(3)

        const expiredRow = all.invitations.find((i) => i.email === expiredEmail)
        expect(expiredRow?.effectiveStatus).toBe("expired")
        expect(expiredRow?.status).toBe("pending")

        const byExpired = await listApi.invitationList({
          query: { status: "expired" },
          headers,
        })
        expect(byExpired.total).toBe(1)
        expect(byExpired.invitations[0].email).toBe(expiredEmail)

        const byRevoked = await listApi.invitationList({
          query: { status: "revoked" },
          headers,
        })
        expect(byRevoked.total).toBe(1)
        expect(byRevoked.invitations[0].email).toBe(revokeEmail)

        const paginated = await listApi.invitationList({
          query: { limit: 2, offset: 0 },
          headers,
        })
        expect(paginated.invitations).toHaveLength(2)
        expect(paginated.total).toBe(3)
      })
    })

    it("searches by email", async () => {
      await createInvitation(listCtx, { email: "alpha@test.com" })
      await createInvitation(listCtx, { email: "beta@test.com" })

      await runAsAdmin(listCtx, async (headers) => {
        const res = await listApi.invitationList({
          query: { searchValue: "beta" },
          headers,
        })
        expect(res.total).toBe(1)
        expect(res.invitations[0].email).toBe("beta@test.com")
      })
    })
  })

  describe("invitation.list edge cases", () => {
    let edgeCtx: InvitationTestContext
    let edgeApi: ReturnType<typeof invitationApi>

    beforeAll(async () => {
      edgeCtx = await setupInvitationTest()
      edgeApi = invitationApi(edgeCtx)
      await createInvitation(edgeCtx, { email: "edge-a@test.com" })
      await createInvitation(edgeCtx, { email: "edge-b@test.com" })
      await createInvitation(edgeCtx, { email: "edge-c@test.com" })
    })

    it("handles string pagination, nulls in sort and equal sort values", async () => {
      const edgeA = await findInvitation(edgeCtx, {
        field: "email",
        value: "edge-a@test.com",
      })
      await edgeCtx.auth.api.signUpEmail({
        body: { email: "edge-a@test.com", password: ADMIN_PASSWORD, name: "Edge A" },
        headers: originHeaders(edgeA!.token),
      })

      await runAsAdmin(edgeCtx, async (headers) => {
        const byNulls = await edgeApi.invitationList({
          query: {
            sortBy: "acceptedAt",
            sortDirection: "asc",
            limit: "10",
            offset: "0",
          },
          headers,
        })
        expect(byNulls.total).toBe(3)
        expect(byNulls.invitations[0].email).toBe("edge-a@test.com")

        const byEqualStatus = await edgeApi.invitationList({
          query: { sortBy: "status" },
          headers,
        })
        expect(byEqualStatus.total).toBe(3)

        const paged = await edgeApi.invitationList({
          query: { sortBy: "invitedAt", limit: "1", offset: "0" },
          headers,
        })
        expect(paged.invitations).toHaveLength(1)
        expect(paged.limit).toBe(1)
        expect(paged.offset).toBe(0)
      })
    })
  })

  describe("schema defaults", () => {
    it("applies the invitedAt and status defaults when not provided", async () => {
      const row = await ctx.db.create({
        model: "invitation",
        data: {
          email: "default-values@test.com",
          token: "schema-default-invited-at-token",
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          invitedBy: ADMIN_EMAIL,
          invitedById: "admin-user-id",
        },
      })

      expect(row).toMatchObject({ status: "pending" })
      expect(row.invitedAt).toBeInstanceOf(Date)
    })
  })

  describe("rate limit", () => {
    let rlCtx: InvitationTestContext
    const BASE_URL = "http://localhost:3000"
    const API_BASE = `${BASE_URL}/api/auth`

    beforeAll(async () => {
      rlCtx = await setupInvitationTest(7, {
        rateLimit: { enabled: true, storage: "memory" },
      })
    })

    it("enforces the plugin's per-route limits", async () => {
      const { headers } = await rlCtx.signInWithUser(ADMIN_EMAIL, ADMIN_PASSWORD)
      const requestHeaders = {
        "content-type": "application/json",
        origin: BASE_URL,
        ...Object.fromEntries(headers.entries()),
      }

      const statuses: number[] = []
      let invitationId = ""

      for (let i = 0; i < 11; i++) {
        const res = await rlCtx.customFetchImpl(`${API_BASE}/invitation/create`, {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify({ email: `rl-${i}@test.com` }),
        })
        statuses.push(res.status)
        if (res.ok) {
          invitationId = (await res.json()).invitation.id
        }
      }

      const resend = await rlCtx.customFetchImpl(`${API_BASE}/invitation/resend`, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({ invitationId }),
      })

      expect(statuses).toContain(429)
      expect(resend.status).toBe(200)
    })
  })

  describe("invitation.revoke", () => {
    it("revokes a pending invitation", async () => {
      const invitation = await createInvitation(ctx, { email: "revoke-me@test.com" })

      await runAsAdmin(ctx, async (headers) => {
        const res = await api.invitationRevoke({
          body: { invitationId: invitation.id },
          headers,
        })
        expect(res.success).toBe(true)
      })

      const stored = await findInvitation(ctx, { field: "id", value: invitation.id })
      expect(stored?.status).toBe("revoked")
    })

    it("rejects revoking an already used invitation", async () => {
      const invitation = await createInvitation(ctx, { email: "revoke-used@test.com" })
      await ctx.db.update({
        model: "invitation",
        where: [{ field: "id", value: invitation.id }],
        update: { status: "accepted" },
      })

      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationRevoke({
            body: { invitationId: invitation.id },
            headers,
          }),
        ).rejects.toMatchObject({
          statusCode: 400,
          body: { code: INVITATION_ERROR_CODES.INVITATION_ALREADY_USED.code },
        })
      })
    })

    it("rejects an unknown invitation", async () => {
      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationRevoke({ body: { invitationId: "nope" }, headers }),
        ).rejects.toMatchObject({
          statusCode: 404,
          body: { code: INVITATION_ERROR_CODES.INVITATION_NOT_FOUND.code },
        })
      })
    })
  })

  describe("invitation.delete", () => {
    it("deletes a revoked invitation", async () => {
      const invitation = await createInvitation(ctx, {
        email: "delete-revoked@test.com",
      })

      await runAsAdmin(ctx, async (headers) => {
        await api.invitationRevoke({
          body: { invitationId: invitation.id },
          headers,
        })
        const res = await api.invitationDelete({
          body: { invitationId: invitation.id },
          headers,
        })
        expect(res.success).toBe(true)
      })

      expect(
        await findInvitation(ctx, { field: "id", value: invitation.id }),
      ).toBeNull()
    })

    it("deletes an expired invitation computed on the fly", async () => {
      const invitation = await createInvitation(ctx, {
        email: "delete-expired@test.com",
      })
      await expireInvitation(ctx, invitation.token)

      await runAsAdmin(ctx, async (headers) => {
        const res = await api.invitationDelete({
          body: { invitationId: invitation.id },
          headers,
        })
        expect(res.success).toBe(true)
      })

      expect(
        await findInvitation(ctx, { field: "id", value: invitation.id }),
      ).toBeNull()
    })

    it("rejects deleting a pending invitation", async () => {
      const invitation = await createInvitation(ctx, {
        email: "delete-pending@test.com",
      })

      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationDelete({
            body: { invitationId: invitation.id },
            headers,
          }),
        ).rejects.toMatchObject({
          statusCode: 400,
          body: { code: INVITATION_ERROR_CODES.INVITATION_CANNOT_DELETE.code },
        })
      })

      expect(
        await findInvitation(ctx, { field: "id", value: invitation.id }),
      ).not.toBeNull()
    })

    it("rejects deleting an accepted invitation", async () => {
      const invitation = await createInvitation(ctx, {
        email: "delete-accepted@test.com",
      })
      await ctx.db.update({
        model: "invitation",
        where: [{ field: "id", value: invitation.id }],
        update: { status: "accepted" },
      })

      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationDelete({
            body: { invitationId: invitation.id },
            headers,
          }),
        ).rejects.toMatchObject({
          statusCode: 400,
          body: { code: INVITATION_ERROR_CODES.INVITATION_CANNOT_DELETE.code },
        })
      })
    })

    it("rejects an unknown invitation", async () => {
      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationDelete({ body: { invitationId: "nope" }, headers }),
        ).rejects.toMatchObject({
          statusCode: 404,
          body: { code: INVITATION_ERROR_CODES.INVITATION_NOT_FOUND.code },
        })
      })
    })
  })

  describe("invitation.resend", () => {
    it("resends the email for a pending invitation", async () => {
      const invitation = await createInvitation(ctx, { email: "resend@test.com" })

      await runAsAdmin(ctx, async (headers) => {
        const res = await api.invitationResend({
          body: { invitationId: invitation.id },
          headers,
        })
        expect(res.success).toBe(true)
      })

      await vi.waitFor(() =>
        expect(sendInvitationEmail).toHaveBeenCalledWith({
          to: invitation.email,
          token: invitation.token,
          expiresInDays: 30,
        }),
      )
    })

    it("rejects resending an expired invitation", async () => {
      const invitation = await createInvitation(ctx, {
        email: "resend-expired@test.com",
      })
      await expireInvitation(ctx, invitation.token)

      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationResend({
            body: { invitationId: invitation.id },
            headers,
          }),
        ).rejects.toMatchObject({
          statusCode: 400,
          body: { code: INVITATION_ERROR_CODES.INVITATION_EXPIRED.code },
        })
      })
    })

    it("rejects resending an already used invitation", async () => {
      const invitation = await createInvitation(ctx, { email: "resend-used@test.com" })
      await ctx.db.update({
        model: "invitation",
        where: [{ field: "id", value: invitation.id }],
        update: { status: "revoked" },
      })

      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationResend({
            body: { invitationId: invitation.id },
            headers,
          }),
        ).rejects.toMatchObject({
          statusCode: 400,
          body: { code: INVITATION_ERROR_CODES.INVITATION_ALREADY_USED.code },
        })
      })
    })

    it("rejects an unknown invitation", async () => {
      await runAsAdmin(ctx, async (headers) => {
        await expect(
          api.invitationResend({ body: { invitationId: "nope" }, headers }),
        ).rejects.toMatchObject({
          statusCode: 404,
          body: { code: INVITATION_ERROR_CODES.INVITATION_NOT_FOUND.code },
        })
      })
    })
  })

  describe("sign-up hooks", () => {
    const inviteeEmail = "hook-invitee@test.com"

    it("accepts the invitation on sign up and links the user", async () => {
      const invitation = await createInvitation(ctx, { email: inviteeEmail })

      const res = await ctx.auth.api.signUpEmail({
        body: { email: inviteeEmail, password: ADMIN_PASSWORD, name: "Invitee" },
        headers: originHeaders(invitation.token),
      })

      expect(res.user.email).toBe(inviteeEmail)

      const stored = await findInvitation(ctx, {
        field: "token",
        value: invitation.token,
      })
      expect(stored?.status).toBe("accepted")
      expect(stored?.userId).toBe(res.user.id)
      expect(stored?.acceptedAt).toBeInstanceOf(Date)
    })

    it("rejects sign up with an unknown token", async () => {
      const email = "unknown-token@test.com"

      await expect(
        ctx.auth.api.signUpEmail({
          body: { email, password: ADMIN_PASSWORD, name: "Invitee" },
          headers: originHeaders("not-a-real-token"),
        }),
      ).rejects.toMatchObject({ statusCode: 400 })

      expect(
        await ctx.db.findOne({
          model: "user",
          where: [{ field: "email", value: email }],
        }),
      ).toBeNull()
    })

    it("rejects sign up when the email does not match the invitation", async () => {
      const invitation = await createInvitation(ctx, { email: "match-hook@test.com" })
      const otherEmail = "mismatch@test.com"

      await expect(
        ctx.auth.api.signUpEmail({
          body: { email: otherEmail, password: ADMIN_PASSWORD, name: "Invitee" },
          headers: originHeaders(invitation.token),
        }),
      ).rejects.toMatchObject({ statusCode: 400 })

      expect(
        await ctx.db.findOne({
          model: "user",
          where: [{ field: "email", value: otherEmail }],
        }),
      ).toBeNull()
    })

    it("rejects sign up with an expired invitation", async () => {
      const invitation = await createInvitation(ctx, { email: "expired-hook@test.com" })
      await expireInvitation(ctx, invitation.token)

      await expect(
        ctx.auth.api.signUpEmail({
          body: {
            email: "expired-hook@test.com",
            password: ADMIN_PASSWORD,
            name: "Invitee",
          },
          headers: originHeaders(invitation.token),
        }),
      ).rejects.toMatchObject({ statusCode: 400 })
    })
  })
})
