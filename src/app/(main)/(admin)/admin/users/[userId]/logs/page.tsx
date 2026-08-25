import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { getUser } from "@/data/auth/get-user"
import { AuditInfo } from "@/components/audit-info"
import { PageShell } from "@/components/page-shell"

const PAGE = definePage({
  title: "Logs",
  description: "View logs.",
  callbackUrl: "/admin/users",
  section: "logs",
})

export const metadata: Metadata = PAGE.metadata

type Params = Promise<{ userId: string }>

export default async function LogsUserAdminPage(props: { params: Params }) {
  const { userId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  const user = await getUser(userId)

  if (!user) notFound()

  return (
    <PageShell page={PAGE} isSection>
      <AuditInfo
        createdAt={user.createdAt}
        updatedAt={user.updatedAt}
        createdBy={user.createdBy}
        updatedBy={user.updatedBy}
      />
    </PageShell>
  )
}
