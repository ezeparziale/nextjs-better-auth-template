import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import CreatePermissionButton from "./_components/create-permission-button"
import PermissionsTable from "./_components/permissions-table"

const PAGE = {
  title: "Permissions",
  description: "Manage permissions",
  callbackUrl: "/admin/permissions",
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

export default async function PermissionsAdminPage(props: {
  searchParams: SearchParams
}) {
  await requireAdmin(PAGE.callbackUrl)

  const searchParams = await props.searchParams

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE.title}
        description={PAGE.description}
        divider
        actions={[<CreatePermissionButton key="action-create-permission" />]}
        mobileActionsBelow={false}
      />
      <DataTableProvider>
        <PermissionsTable initialParams={searchParams} />
      </DataTableProvider>
    </div>
  )
}
