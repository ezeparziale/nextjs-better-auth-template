import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageShell } from "@/components/page-shell"
import AddPermissionDialog from "./_components/add-permission-dialog"
import RolePermissionsTable from "./_components/role-permissions-table"

const PAGE = definePage({
  title: "Manage role permissions",
  description: "Assign or remove permissions from this role.",
  getCallbackUrl: (roleId: string) => `/admin/roles/${roleId}/permissions`,
})

export const metadata: Metadata = PAGE.metadata

type SearchParams = Promise<{
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
}>

type Params = Promise<{ roleId: string }>

export default async function PermissionsRoleAdminPage(props: {
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
        actions={[
          <AddPermissionDialog roleId={roleId} key="btn-action-add-permission" />,
        ]}
      >
        <RolePermissionsTable roleId={roleId} initialParams={searchParams} />
      </PageShell>
    </DataTableProvider>
  )
}
