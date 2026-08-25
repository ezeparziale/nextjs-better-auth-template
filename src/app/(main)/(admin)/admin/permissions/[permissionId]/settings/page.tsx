import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { getPermission } from "@/data/auth/get-permission"
import { PageShell } from "@/components/page-shell"
import EditPermissionForm from "./_components/edit-permission-form"

const PAGE = definePage({
  title: "Edit permission",
  description: "Edit the permission's settings.",
  callbackUrl: "/admin/permissions",
  section: "settings",
})

export const metadata: Metadata = PAGE.metadata

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
    <PageShell page={PAGE} isSection>
      <EditPermissionForm permission={permissionDTO} />
    </PageShell>
  )
}
