import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { getRole } from "@/data/auth/get-role"
import { PageHeader } from "@/components/page-header"
import EditRoleForm from "./_components/edit-role-form"

const PAGE = {
  title: "Edit role",
  description: "Edit the role's settings.",
  callbackUrl: "/admin/roles",
  section: "settings",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ roleId: string }>

export default async function SettingsRoleAdminPage(props: { params: Params }) {
  const { roleId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${roleId}/${PAGE.section}`)

  const role = await getRole(roleId)

  if (!role) return notFound()

  const roleDTO = {
    id: role.id,
    name: role.name,
    key: role.key,
    description: role.description,
    isActive: role.isActive,
  }

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <EditRoleForm role={roleDTO} />
    </div>
  )
}
