"use client"

import { useCallback, useMemo, useState } from "react"
import { KeyIcon, MinusIcon } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { Permission } from "@/lib/auth/rbac-plugin"
import { Button } from "@/components/ui/button"
import {
  TableDefault,
  useServerDataTable,
  type TableDefaultInitialParams,
  type TableFetchFn,
} from "@/components/table-default"
import BulkRemovePermissionsDialog from "./bulk-remove-permissions-dialog"
import { getColumns } from "./columns"

type ListRolePermissionsQuery = Omit<
  NonNullable<Parameters<typeof authClient.rbac.getRolePermissions>[0]>["query"],
  "roleId"
>

const DEFAULT_COLUMN_VISIBILITY = {
  name: true,
  key: true,
  isActive: true,
  createdAt: false,
  updatedAt: false,
  createdBy: false,
  updatedBy: false,
}

const SORTABLE_COLUMNS = [
  "name",
  "key",
  "isActive",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
]

export default function RolePermissionsTable({
  initialParams,
  roleId,
}: {
  initialParams: TableDefaultInitialParams
  roleId: string
}) {
  const [isBulkRemoveOpen, setIsBulkRemoveOpen] = useState(false)

  const columns = useMemo(() => getColumns(roleId), [roleId])

  const fetchData = useCallback<TableFetchFn<Permission>>(
    async ({ pageIndex, pageSize, sorting, search }) => {
      const queryParams: ListRolePermissionsQuery = {
        limit: pageSize,
        offset: pageIndex * pageSize,
      }

      if (search) {
        queryParams.searchValue = search
        queryParams.searchField = "name"
        queryParams.searchOperator = "contains"
      }

      if (sorting.length > 0) {
        queryParams.sortBy = sorting[0].id
        queryParams.sortDirection = sorting[0].desc ? "desc" : "asc"
      }

      const { data, error } = await authClient.rbac.getRolePermissions({
        query: {
          ...queryParams,
          roleId,
        },
      })

      if (error) {
        throw error
      }

      return {
        rows: data.permissions || [],
        total: data.total || 0,
      }
    },
    [roleId],
  )

  const { table, loading, searchInput, handleClearSearch, handleSearchChange } =
    useServerDataTable<Permission>({
      columns,
      fetchData,
      getRowId: (row) => row.id,
      initialParams,
      defaultColumnVisibility: DEFAULT_COLUMN_VISIBILITY,
      sortableColumns: SORTABLE_COLUMNS,
      enableSelection: true,
      defaultSorting: [],
    })

  const selectedPermissionIds = table
    .getSelectedRowModel()
    .rows.map((row) => row.original.id)

  return (
    <>
      <TableDefault<Permission>
        table={table}
        loading={loading}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        searchPlaceholder="Search name…"
        enableSelection
        selectedActions={
          <Button
            size="sm"
            type="button"
            variant="destructive"
            disabled={selectedPermissionIds.length === 0}
            onClick={() => setIsBulkRemoveOpen(true)}
          >
            <MinusIcon />
            Remove
          </Button>
        }
        emptyState={{ entityLabel: "permissions", icon: KeyIcon }}
      />
      <BulkRemovePermissionsDialog
        roleId={roleId}
        permissionIds={selectedPermissionIds}
        isOpen={isBulkRemoveOpen}
        setIsOpen={setIsBulkRemoveOpen}
        onCompleted={() => table.resetRowSelection()}
      />
    </>
  )
}
