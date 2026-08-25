import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageShell } from "@/components/page-shell"
import AddUserDialog from "./_components/add-user-dialog"
import RoleUsersTable from "./_components/role-users-table"

const PAGE = definePage({
  title: "Manage role users",
  description: "Assign or remove users from this role.",
  getCallbackUrl: (roleId: string) => `/admin/roles/${roleId}/users`,
  section: "users",
} as const)

export const metadata: Metadata = PAGE.metadata

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
    <DataTableProvider>
      <PageShell
        page={PAGE}
        isSection
        actions={[<AddUserDialog roleId={roleId} key="btn-action-add-user" />]}
      >
        <RoleUsersTable roleId={roleId} initialParams={searchParams} />
      </PageShell>
    </DataTableProvider>
  )
}
