import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { AuditInfo } from "@/components/audit-info"
import { PageHeader } from "@/components/page-header"
import { getUser } from "../get-user"

const PAGE = {
  title: "Logs",
  description: "View logs.",
  callbackUrl: "/admin/users",
  section: "logs",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ userId: string }>

export default async function LogsUserAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const params = await props.params
  const userId = params.userId

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/dashboard")

  const user = await getUser(userId)

  if (!user) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <AuditInfo
        createdAt={user.createdAt}
        updatedAt={user.updatedAt}
        createdBy={user.createdBy}
        updatedBy={user.updatedBy}
      />
    </div>
  )
}
