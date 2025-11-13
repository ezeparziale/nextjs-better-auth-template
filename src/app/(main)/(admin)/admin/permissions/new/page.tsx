import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
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
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  if (session.user.role !== "admin") redirect("/dashboard")

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
