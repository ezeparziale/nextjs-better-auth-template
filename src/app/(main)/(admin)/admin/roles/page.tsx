import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageShell } from "@/components/page-shell"
import CreateRoleButton from "./_components/create-role-button"
import RolesTable from "./_components/roles-table"

const PAGE = definePage({
  title: "Roles",
  description: "Manage roles",
  callbackUrl: "/admin/roles",
})

export const metadata: Metadata = PAGE.metadata

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
    <PageShell
      page={PAGE}
      divider
      actions={[<CreateRoleButton key="action-create-role" />]}
      mobileActionsBelow={false}
    >
      <DataTableProvider>
        <RolesTable initialParams={searchParams} />
      </DataTableProvider>
    </PageShell>
  )
}
