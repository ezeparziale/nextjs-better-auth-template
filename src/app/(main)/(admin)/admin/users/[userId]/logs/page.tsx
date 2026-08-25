import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { getUser } from "@/data/auth/get-user"
import { AuditInfo } from "@/components/audit-info"
import { PageHeader } from "@/components/page-header"

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
  const { userId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

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
