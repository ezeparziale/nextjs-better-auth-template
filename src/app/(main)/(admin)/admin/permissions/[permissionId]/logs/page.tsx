import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { getPermission } from "@/data/auth/get-permission"
import { AuditInfo } from "@/components/audit-info"
import { PageHeader } from "@/components/page-header"

const PAGE = {
  title: "Logs",
  description: "Here you can see the logs of this permission.",
  callbackUrl: "/admin/logs",
  section: "logs",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ permissionId: string }>

export default async function LogsPermissionAdminPage(props: { params: Params }) {
  const { permissionId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${permissionId}/${PAGE.section}`)

  const permission = await getPermission(permissionId)

  if (!permission) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <AuditInfo
        createdAt={permission.createdAt}
        updatedAt={permission.updatedAt}
        createdBy={permission.createdBy}
        updatedBy={permission.updatedBy}
      />
    </div>
  )
}
