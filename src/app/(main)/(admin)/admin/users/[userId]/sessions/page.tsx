import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import UserSessionsList from "../_components/user-sessions-list"

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

export default async function NewUserAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { userId } = await props.params

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/dashboard")

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
