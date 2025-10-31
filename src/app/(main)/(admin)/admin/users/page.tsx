import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import UsersTable from "./_components/users-table"

const PAGE = {
  title: "Users",
  description: "Here you can manage all the users of the application.",
  callbackUrl: "/admin/users",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function UsersAdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  if (session.user.role !== "admin") redirect("/dashboard")

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} divider />
      <UsersTable />
    </div>
  )
}
