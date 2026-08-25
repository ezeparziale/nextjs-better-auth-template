import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { PageHeader } from "@/components/page-header"
import CreateUserForm from "../_components/create-user-form"

const PAGE = {
  title: "Create user",
  description: "Here you can create a new user and assign them a role.",
  callbackUrl: "/admin/users/new",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function NewUserAdminPage() {
  await requireAdmin(PAGE.callbackUrl)

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE.title}
        description={PAGE.description}
        divider
        backLink="/admin/users"
      />
      <CreateUserForm />
    </div>
  )
}
