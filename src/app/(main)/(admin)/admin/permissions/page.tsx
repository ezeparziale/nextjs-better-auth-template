import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageShell } from "@/components/page-shell"
import CreatePermissionButton from "./_components/create-permission-button"
import PermissionsTable from "./_components/permissions-table"

const PAGE = definePage({
  title: "Permissions",
  description: "Manage permissions",
  callbackUrl: "/admin/permissions",
})

export const metadata: Metadata = PAGE.metadata

type SearchParams = Promise<{
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
}>

export default async function PermissionsAdminPage(props: {
  searchParams: SearchParams
}) {
  await requireAdmin(PAGE.callbackUrl)

  const searchParams = await props.searchParams

  return (
    <PageShell
      page={PAGE}
      divider
      actions={[<CreatePermissionButton key="action-create-permission" />]}
      mobileActionsBelow={false}
    >
      <DataTableProvider>
        <PermissionsTable initialParams={searchParams} />
      </DataTableProvider>
    </PageShell>
  )
}
