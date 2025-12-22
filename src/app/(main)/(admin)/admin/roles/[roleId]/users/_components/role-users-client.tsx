"use client"

import { useDataTable } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import AddUserDialog from "./add-user-dialog"
import RoleUsersTable from "./role-users-table"

type InitialParams = {
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
}

export default function RoleUsersClient({
  roleId,
  page,
  initialParams,
}: {
  roleId: string
  page: { title: string; description: string }
  initialParams: InitialParams
}) {
  const { refreshTable } = useDataTable()

  return (
    <>
      <PageHeader
        title={page.title}
        description={page.description}
        isSection
        actions={[
          <AddUserDialog
            roleId={roleId}
            onUserAdded={refreshTable}
            key="btn-action-add-user"
          />,
        ]}
      />
      <RoleUsersTable roleId={roleId} initialParams={initialParams} />
    </>
  )
}
