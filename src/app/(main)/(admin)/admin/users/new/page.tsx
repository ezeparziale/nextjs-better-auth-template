import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
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
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  if (session.user.role !== "admin") redirect("/dashboard")

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} divider />
      <CreateUserForm />
    </div>
  )
}
