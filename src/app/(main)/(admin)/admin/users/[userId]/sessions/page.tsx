import type { Metadata } from "next"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"
import UserSessionsList from "./_components/user-sessions-list"

const PAGE = definePage({
  title: "User sessions",
  description: "Here you can see all the sessions of this user.",
  callbackUrl: "/admin/users",
  section: "sessions",
})

export const metadata: Metadata = PAGE.metadata

type Params = Promise<{ userId: string }>

export default async function SessionsUserAdminPage(props: { params: Params }) {
  const { userId } = await props.params

  const session = await requireAdmin(`${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  const { sessions } = await auth.api.listUserSessions({
    body: {
      userId: userId,
    },
    headers: await headers(),
  })

  return (
    <PageShell page={PAGE} isSection>
      <UserSessionsList sessions={sessions} userCurrentSession={session.session.id} />
    </PageShell>
  )
}
