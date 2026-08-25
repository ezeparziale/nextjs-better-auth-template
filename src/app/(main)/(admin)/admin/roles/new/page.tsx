import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"
import CreateRoleForm from "../_components/create-role-form"

const PAGE = definePage({
  title: "Create role",
  description: "Here you can create a new role.",
  callbackUrl: "/admin/users/new",
})

export const metadata: Metadata = PAGE.metadata

export default async function NewRoleAdminPage() {
  await requireAdmin(PAGE.callbackUrl)

  return (
    <PageShell page={PAGE} divider backLink="/admin/roles">
      <CreateRoleForm />
    </PageShell>
  )
}
