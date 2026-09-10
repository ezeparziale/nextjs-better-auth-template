"use client"

import { useCallback, useMemo } from "react"
import { KeyIcon } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { Role } from "@/lib/auth/rbac-plugin"
import {
  TableDefault,
  useServerDataTable,
  type TableDefaultInitialParams,
  type TableFetchFn,
} from "@/components/table-default"
import { getColumns } from "./columns"

type ListUserRolesQuery = Omit<
  NonNullable<Parameters<typeof authClient.rbac.getUserRoles>[0]>["query"],
  "userId"
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

export default function UserRolesTable({
  initialParams,
  userId,
}: {
  initialParams: TableDefaultInitialParams
  userId: string
}) {
  const columns = useMemo(() => getColumns(userId), [userId])

  const fetchData = useCallback<TableFetchFn<Role>>(
    async ({ pageIndex, pageSize, sorting, search }) => {
      const queryParams: ListUserRolesQuery = {
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

      const { data, error } = await authClient.rbac.getUserRoles({
        query: {
          ...queryParams,
          userId,
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
    [userId],
  )

  const { table, loading, searchInput, handleClearSearch, handleSearchChange } =
    useServerDataTable<Role>({
      columns,
      fetchData,
      getRowId: (row) => row.id,
      initialParams,
      defaultColumnVisibility: DEFAULT_COLUMN_VISIBILITY,
      sortableColumns: SORTABLE_COLUMNS,
      defaultSorting: [],
    })

  return (
    <TableDefault<Role>
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
