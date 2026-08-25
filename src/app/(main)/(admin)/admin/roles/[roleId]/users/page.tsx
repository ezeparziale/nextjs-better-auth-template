import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import AddUserDialog from "./_components/add-user-dialog"
import RoleUsersTable from "./_components/role-users-table"

const PAGE = {
  title: "Manage role users",
  description: "Assign or remove users from this role.",
  getCallbackUrl: (roleId: string) => `/admin/roles/${roleId}/users`,
  section: "users",
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

type Params = Promise<{ roleId: string }>

export default async function UsersRoleAdminPage(props: {
  params: Params
  searchParams: SearchParams
}) {
  const { roleId } = await props.params

  await requireAdmin(PAGE.getCallbackUrl(roleId))

  const searchParams = await props.searchParams

  return (
    <div className="space-y-6">
      <DataTableProvider>
        <PageHeader
          title={PAGE.title}
          description={PAGE.description}
          isSection
          actions={[<AddUserDialog roleId={roleId} key="btn-action-add-user" />]}
        />
        <RoleUsersTable roleId={roleId} initialParams={searchParams} />
      </DataTableProvider>
    </div>
  )
}
