import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { PageHeader } from "@/components/page-header"
import { SessionsList } from "./_components/sessions-list"

const PAGE = {
  title: "Sessions",
  description: "Manage and view your active sessions",
  callbackUrl: "/settings/sessions",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function SessionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  const sessions = await auth.api.listSessions({
    headers: await headers(),
  })

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <SessionsList currentSessionToken={session.session.token} sessions={sessions} />
    </div>
  )
}
