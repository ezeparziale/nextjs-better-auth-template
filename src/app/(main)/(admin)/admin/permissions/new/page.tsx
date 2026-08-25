import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"
import CreatePermissionForm from "../_components/create-permission-form"

const PAGE = definePage({
  title: "Create permission",
  description: "Here you can create a new permission.",
  callbackUrl: "/admin/users/new",
})

export const metadata: Metadata = PAGE.metadata

export default async function NewPermissionAdminPage() {
  await requireAdmin(PAGE.callbackUrl)

  return (
    <PageShell page={PAGE} divider backLink="/admin/permissions">
      <CreatePermissionForm />
    </PageShell>
  )
}
