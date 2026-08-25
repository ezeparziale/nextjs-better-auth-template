import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { getRole } from "@/data/auth/get-role"
import { AuditInfo } from "@/components/audit-info"
import { PageHeader } from "@/components/page-header"

const PAGE = {
  title: "Logs",
  description: "Here you can see the logs of this role.",
  callbackUrl: "/admin/logs",
  section: "logs",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ roleId: string }>

export default async function LogsRoleAdminPage(props: { params: Params }) {
  const { roleId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${roleId}/${PAGE.section}`)

  const role = await getRole(roleId)

  if (!role) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <AuditInfo
        createdAt={role.createdAt}
        updatedAt={role.updatedAt}
        createdBy={role.createdBy}
        updatedBy={role.updatedBy}
      />
    </div>
  )
}
