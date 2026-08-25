import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { getPermission } from "@/data/auth/get-permission"
import { AuditInfo } from "@/components/audit-info"
import { PageShell } from "@/components/page-shell"

const PAGE = definePage({
  title: "Logs",
  description: "Here you can see the logs of this permission.",
  callbackUrl: "/admin/logs",
  section: "logs",
})

export const metadata: Metadata = PAGE.metadata

type Params = Promise<{ permissionId: string }>

export default async function LogsPermissionAdminPage(props: { params: Params }) {
  const { permissionId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${permissionId}/${PAGE.section}`)

  const permission = await getPermission(permissionId)

  if (!permission) notFound()

  return (
    <PageShell page={PAGE} isSection>
      <AuditInfo
        createdAt={permission.createdAt}
        updatedAt={permission.updatedAt}
        createdBy={permission.createdBy}
        updatedBy={permission.updatedBy}
      />
    </PageShell>
  )
}
