import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { DataTableProvider } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import CreateUserButton from "./_components/create-user-button"
import { ExportUsersButton } from "./_components/export-users-button"
import UsersTable from "./_components/users-table"

const PAGE = {
  title: "Users",
  description: "Here you can manage all the users of the application.",
  callbackUrl: "/admin/users",
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

export default async function UsersAdminPage(props: { searchParams: SearchParams }) {
  await requireAdmin(PAGE.callbackUrl)

  const searchParams = await props.searchParams

  return (
    <div className="space-y-6">
      <PageHeader
        title={PAGE.title}
        description={PAGE.description}
        divider
        actions={[
          <ExportUsersButton key="action-export-users" />,
          <CreateUserButton key="action-create-user" />,
        ]}
      />
      <DataTableProvider>
        <UsersTable initialParams={searchParams} />
      </DataTableProvider>
    </div>
  )
}
