"use client"

import { useCallback, useMemo } from "react"
import { KeyIcon } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { Permission } from "@/lib/auth/rbac-plugin"
import {
  TableDefault,
  useServerDataTable,
  type TableDefaultInitialParams,
  type TableFetchFn,
} from "@/components/table-default"
import { getColumns } from "./columns"

type ListPermissionRolesQuery = Omit<
  NonNullable<Parameters<typeof authClient.rbac.getPermissionRoles>[0]>["query"],
  "permissionId"
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

export default function PermissionRolesTable({
  initialParams,
  permissionId,
}: {
  initialParams: TableDefaultInitialParams
  permissionId: string
}) {
  const columns = useMemo(() => getColumns(permissionId), [permissionId])

  const fetchData = useCallback<TableFetchFn<Permission>>(
    async ({ pageIndex, pageSize, sorting, search }) => {
      const queryParams: ListPermissionRolesQuery = {
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

      const { data, error } = await authClient.rbac.getPermissionRoles({
        query: {
          ...queryParams,
          permissionId,
        },
      })

      if (error) {
        throw error
      }

      return {
        rows: data.roles || [],
        total: data.total || 0,
      }
    },
    [permissionId],
  )

  const { table, loading, searchInput, handleClearSearch, handleSearchChange } =
    useServerDataTable<Permission>({
      columns,
      fetchData,
      getRowId: (row) => row.id,
      initialParams,
      defaultColumnVisibility: DEFAULT_COLUMN_VISIBILITY,
      sortableColumns: SORTABLE_COLUMNS,
      defaultSorting: [],
    })

  return (
    <TableDefault<Permission>
      table={table}
      loading={loading}
      searchInput={searchInput}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearSearch}
      searchPlaceholder="Search name…"
      emptyState={{ entityLabel: "roles", icon: KeyIcon }}
    />
  )
}
