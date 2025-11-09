import { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import EditPermissionForm from "../_components/edit-permission-form"
import { getPermission } from "../get-permission"

const PAGE = {
  title: "Edit permission",
  description: "Edit the permission's settings.",
  callbackUrl: "/admin/permissions",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ permissionId: string }>

export default async function SettingsPermissionAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { permissionId } = await props.params

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${permissionId}/settings`)

  if (session.user.role !== "admin") redirect("/dashboard")

  const permission = await getPermission(permissionId)

  if (!permission) return notFound()

  const permissionDTO = {
    id: permission.id,
    name: permission.name,
    key: permission.key,
    description: permission.description,
    isActive: permission.isActive,
  }

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <EditPermissionForm permission={permissionDTO} />
    </div>
  )
}
