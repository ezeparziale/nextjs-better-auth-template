import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageShell } from "@/components/page-shell"
import CreateUserButton from "./_components/create-user-button"
import { ExportUsersButton } from "./_components/export-users-button"
import UsersTable from "./_components/users-table"

const PAGE = definePage({
  title: "Users",
  description: "Here you can manage all the users of the application.",
  callbackUrl: "/admin/users",
})

export const metadata: Metadata = PAGE.metadata

type SearchParams = Promise<{
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
}>

export default async function UsersAdminPage(props: { searchParams: SearchParams }) {
  await requireAdmin(PAGE.callbackUrl)

  const searchParams = await props.searchParams

  return (
    <PageShell
      page={PAGE}
      divider
      actions={[
        <ExportUsersButton key="action-export-users" />,
        <CreateUserButton key="action-create-user" />,
      ]}
    >
      <DataTableProvider>
        <UsersTable initialParams={searchParams} />
      </DataTableProvider>
    </PageShell>
  )
}
