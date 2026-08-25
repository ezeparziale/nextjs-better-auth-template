import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageShell } from "@/components/page-shell"
import AddRoleDialog from "./_components/add-role-dialog"
import PermissionRolesTable from "./_components/permission-roles-table"

const PAGE = definePage({
  title: "Manage permission roles",
  description: "Assign or remove roles from this permission.",
  getCallbackUrl: (permissionId: string) => `/admin/permissions/${permissionId}/roles`,
} as const)

export const metadata: Metadata = PAGE.metadata
type SearchParams = Promise<{
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
}>

type Params = Promise<{ permissionId: string }>

export default async function RolesPermissionAdminPage(props: {
  params: Params
  searchParams: SearchParams
}) {
  const { permissionId } = await props.params

  await requireAdmin(PAGE.getCallbackUrl(permissionId))

  const searchParams = await props.searchParams

  return (
    <DataTableProvider>
      <PageShell
        page={PAGE}
        isSection
        actions={[
          <AddRoleDialog permissionId={permissionId} key="btn-action-add-role" />,
        ]}
      >
        <PermissionRolesTable
          permissionId={permissionId}
          initialParams={searchParams}
        />
      </PageShell>
    </DataTableProvider>
  )
}
