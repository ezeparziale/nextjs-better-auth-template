import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { getRole } from "@/data/auth/get-role"
import { PageShell } from "@/components/page-shell"
import EditRoleForm from "./_components/edit-role-form"

const PAGE = definePage({
  title: "Edit role",
  description: "Edit the role's settings.",
  callbackUrl: "/admin/roles",
  section: "settings",
})

export const metadata: Metadata = PAGE.metadata

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
    <PageShell page={PAGE} isSection>
      <EditRoleForm role={roleDTO} />
    </PageShell>
  )
}
