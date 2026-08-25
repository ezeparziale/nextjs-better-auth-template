import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { getUser } from "@/data/auth/get-user"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageShell } from "@/components/page-shell"
import AddRoleDialog from "./_components/add-role-dialog"
import UserRolesTable from "./_components/user-roles-table"

const PAGE = definePage({
  title: "User roles",
  description: "Assign or remove roles from this user.",
  getCallbackUrl: (userId: string) => `/admin/users/${userId}/roles`,
  section: "roles",
} as const)

export const metadata: Metadata = PAGE.metadata

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
  const { userId } = await props.params

  await requireAdmin(PAGE.getCallbackUrl(userId))

  const user = await getUser(userId)

  if (!user) return notFound()

  const searchParams = await props.searchParams

  return (
    <DataTableProvider>
      <PageShell
        page={PAGE}
        isSection
        actions={[<AddRoleDialog userId={userId} key="btn-action-add-role" />]}
      >
        <UserRolesTable userId={userId} initialParams={searchParams} />
      </PageShell>
    </DataTableProvider>
  )
}
