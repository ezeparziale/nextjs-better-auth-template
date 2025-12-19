"use client"

import { useDataTable } from "@/components/ui/data-table"
import { PageHeader } from "@/components/page-header"
import AddPermissionDialog from "./add-permission-dialog"
import RolePermissionsTable from "./role-permissions-table"

type InitialParams = {
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
}

export default function RolePermissionsClient({
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
          <AddPermissionDialog
            roleId={roleId}
            onPermissionAdded={refreshTable}
            key="btn-action-add-permission"
          />,
        ]}
      />
      <RolePermissionsTable roleId={roleId} initialParams={initialParams} />
    </>
  )
}
