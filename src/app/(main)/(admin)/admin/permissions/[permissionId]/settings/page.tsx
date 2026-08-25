import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { getPermission } from "@/data/auth/get-permission"
import { PageHeader } from "@/components/page-header"
import EditPermissionForm from "./_components/edit-permission-form"

const PAGE = {
  title: "Edit permission",
  description: "Edit the permission's settings.",
  callbackUrl: "/admin/permissions",
  section: "settings",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ permissionId: string }>

export default async function SettingsPermissionAdminPage(props: { params: Params }) {
  const { permissionId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${permissionId}/${PAGE.section}`)

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
