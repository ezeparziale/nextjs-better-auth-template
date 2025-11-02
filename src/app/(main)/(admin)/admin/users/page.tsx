import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { PageHeader } from "@/components/page-header"
import CreateUserButton from "./_components/create-user-button"
import { UsersProvider } from "./_components/users-context"
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

type SearchParams = Promise<{
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
}>

export default async function UsersAdminPage(props: { searchParams: SearchParams }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  if (session.user.role !== "admin") redirect("/dashboard")

  const searchParams = await props.searchParams

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE.title}
        description={PAGE.description}
        divider
        actions={[<CreateUserButton key="action-create-user" />]}
      />
      <UsersProvider>
        <UsersTable initialParams={searchParams} />
      </UsersProvider>
    </div>
  )
}
