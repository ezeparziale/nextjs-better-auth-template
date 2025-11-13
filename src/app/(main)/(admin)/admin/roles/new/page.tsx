import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
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
        backLink="/admin/roles"
      />
      <CreateRoleForm />
    </div>
  )
}
