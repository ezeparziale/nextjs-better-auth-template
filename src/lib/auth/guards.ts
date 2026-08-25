import "server-only"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import type { Session } from "@/lib/auth/auth"
import { ERROR_CODES, errorUrl } from "@/lib/error-codes"

export async function requireSession(callbackUrl?: string): Promise<Session> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect(callbackUrl ? `/login?callbackUrl=${callbackUrl}` : "/login")
  }

  return session
}

export async function requireAdmin(callbackUrl?: string): Promise<Session> {
  const session = await requireSession(callbackUrl)

  if (session.user.role !== "admin") {
    redirect(errorUrl(ERROR_CODES.ACCESS_UNAUTHORIZED))
  }

  return session
}
