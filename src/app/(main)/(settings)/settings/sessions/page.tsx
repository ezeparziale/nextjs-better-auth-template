import type { Metadata } from "next"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { requireSession } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"
import { SessionsList } from "./_components/sessions-list"

const PAGE = definePage({
  title: "Sessions",
  description: "Manage and view your active sessions",
  callbackUrl: "/settings/sessions",
})

export const metadata: Metadata = PAGE.metadata

export default async function SessionsPage() {
  const session = await requireSession(PAGE.callbackUrl)

  const sessions = await auth.api.listSessions({
    headers: await headers(),
  })

  return (
    <PageShell page={PAGE} isSection>
      <SessionsList currentSessionToken={session.session.token} sessions={sessions} />
    </PageShell>
  )
}
