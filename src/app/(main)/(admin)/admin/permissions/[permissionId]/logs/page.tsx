import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
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
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { permissionId } = await props.params

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${permissionId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/dashboard")

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
