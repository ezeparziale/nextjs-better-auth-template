import type { Metadata } from "next"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { requireAdmin } from "@/lib/auth/guards"
import { PageHeader } from "@/components/page-header"
import UserSessionsList from "./_components/user-sessions-list"

const PAGE = {
  title: "User sessions",
  description: "Here you can see all the sessions of this user.",
  callbackUrl: "/admin/users",
  section: "sessions",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

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
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <UserSessionsList sessions={sessions} userCurrentSession={session.session.id} />
    </div>
  )
}
