import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { getRole } from "@/data/auth/get-role"
import { AuditInfo } from "@/components/audit-info"
import { PageShell } from "@/components/page-shell"

const PAGE = definePage({
  title: "Logs",
  description: "Here you can see the logs of this role.",
  callbackUrl: "/admin/logs",
  section: "logs",
})

export const metadata: Metadata = PAGE.metadata

type Params = Promise<{ roleId: string }>

export default async function LogsRoleAdminPage(props: { params: Params }) {
  const { roleId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${roleId}/${PAGE.section}`)

  const role = await getRole(roleId)

  if (!role) notFound()

  return (
    <PageShell page={PAGE} isSection>
      <AuditInfo
        createdAt={role.createdAt}
        updatedAt={role.updatedAt}
        createdBy={role.createdBy}
        updatedBy={role.updatedBy}
      />
    </PageShell>
  )
}
