"use client"

import { useCallback, useMemo } from "react"
import { KeyIcon } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { User } from "@/lib/auth/rbac-plugin"
import {
  TableDefault,
  useServerDataTable,
  type TableDefaultInitialParams,
  type TableFetchFn,
} from "@/components/table-default"
import { getColumns } from "./columns"

type ListRoleUsersQuery = Omit<
  NonNullable<Parameters<typeof authClient.rbac.getRoleUsers>[0]>["query"],
  "roleId"
>

const DEFAULT_COLUMN_VISIBILITY = {
  name: true,
  email: true,
  createdAt: false,
  updatedAt: false,
}

const SORTABLE_COLUMNS = ["name", "email", "createdAt", "updatedAt"]

export default function RoleUsersTable({
  initialParams,
  roleId,
}: {
  initialParams: TableDefaultInitialParams
  roleId: string
}) {
  const columns = useMemo(() => getColumns(roleId), [roleId])

  const fetchData = useCallback<TableFetchFn<User>>(
    async ({ pageIndex, pageSize, sorting, search }) => {
      const queryParams: ListRoleUsersQuery = {
        limit: pageSize,
        offset: pageIndex * pageSize,
      }

      if (search) {
        queryParams.searchValue = search
        queryParams.searchField = "email"
        queryParams.searchOperator = "contains"
      }

      if (sorting.length > 0) {
        queryParams.sortBy = sorting[0].id
        queryParams.sortDirection = sorting[0].desc ? "desc" : "asc"
      }

      const { data, error } = await authClient.rbac.getRoleUsers({
        query: {
          ...queryParams,
          roleId,
        },
      })

      if (error) {
        throw error
      }

      return {
        rows: data.users || [],
        total: data.total || 0,
      }
    },
    [roleId],
  )

  const { table, loading, searchInput, handleClearSearch, handleSearchChange } =
    useServerDataTable<User>({
      columns,
      fetchData,
      getRowId: (row) => row.id,
      initialParams,
      defaultColumnVisibility: DEFAULT_COLUMN_VISIBILITY,
      sortableColumns: SORTABLE_COLUMNS,
      defaultSorting: [],
    })

  return (
    <TableDefault<User>
      table={table}
      loading={loading}
      searchInput={searchInput}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearSearch}
      searchPlaceholder="Search email…"
      emptyState={{ entityLabel: "users", icon: KeyIcon }}
    />
  )
}
