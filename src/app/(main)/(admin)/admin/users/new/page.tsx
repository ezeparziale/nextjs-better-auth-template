import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"
import CreateUserForm from "../_components/create-user-form"

const PAGE = definePage({
  title: "Create user",
  description: "Here you can create a new user and assign them a role.",
  callbackUrl: "/admin/users/new",
})

export const metadata: Metadata = PAGE.metadata

export default async function NewUserAdminPage() {
  await requireAdmin(PAGE.callbackUrl)

  return (
    <PageShell page={PAGE} divider backLink="/admin/users">
      <CreateUserForm />
    </PageShell>
  )
}
