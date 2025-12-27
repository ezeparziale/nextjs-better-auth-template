import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getUser } from "@/data/auth/get-user"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import AddRoleDialog from "./_components/add-role-dialog"
import UserRolesTable from "./_components/user-roles-table"

const PAGE = {
  title: "User roles",
  description: "Assign or remove roles from this user.",
  getCallbackUrl: (userId: string) => `/admin/users/${userId}/roles`,
  section: "roles",
} as const

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

type Params = Promise<{ userId: string }>

export default async function RolesUserAdminPage(props: {
  params: Params
  searchParams: SearchParams
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { userId } = await props.params

  if (!session) redirect(`/login?callbackUrl=${PAGE.getCallbackUrl(userId)}`)

  if (session.user.role !== "admin") redirect("/error?error=access_unauthorized")

  const user = await getUser(userId)

  if (!user) return notFound()

  const searchParams = await props.searchParams

  return (
    <div className="space-y-6">
      <DataTableProvider>
        <PageHeader
          title={PAGE.title}
          description={PAGE.description}
          isSection
          actions={[<AddRoleDialog userId={userId} key="btn-action-add-role" />]}
        />
        <UserRolesTable userId={userId} initialParams={searchParams} />
      </DataTableProvider>
    </div>
  )
}
