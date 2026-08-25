import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { PageHeader } from "@/components/page-header"
import CreatePermissionForm from "../_components/create-permission-form"

const PAGE = {
  title: "Create permission",
  description: "Here you can create a new permission.",
  callbackUrl: "/admin/users/new",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function NewPermissionAdminPage() {
  await requireAdmin(PAGE.callbackUrl)

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE.title}
        description={PAGE.description}
        divider
        backLink="/admin/permissions"
      />
      <CreatePermissionForm />
    </div>
  )
}
