import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { PageHeader } from "@/components/page-header"
import CreateRoleForm from "../_components/create-role-form"

const PAGE = {
  title: "Create role",
  description: "Here you can create a new role.",
  callbackUrl: "/admin/users/new",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function NewRoleAdminPage() {
  await requireAdmin(PAGE.callbackUrl)

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE.title}
        description={PAGE.description}
        divider
        backLink="/admin/roles"
      />
      <CreateRoleForm />
    </div>
  )
}
