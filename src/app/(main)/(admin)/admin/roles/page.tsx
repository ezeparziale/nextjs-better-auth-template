import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import CreateRoleButton from "./_components/create-role-button"
import RolesTable from "./_components/roles-table"

const PAGE = {
  title: "Roles",
  description: "Manage roles",
  callbackUrl: "/admin/roles",
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

export default async function RolesAdminPage(props: { searchParams: SearchParams }) {
  await requireAdmin(PAGE.callbackUrl)

  const searchParams = await props.searchParams

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE.title}
        description={PAGE.description}
        divider
        actions={[<CreateRoleButton key="action-create-role" />]}
        mobileActionsBelow={false}
      />
      <DataTableProvider>
        <RolesTable initialParams={searchParams} />
      </DataTableProvider>
    </div>
  )
}
