"use client"

import { useCallback } from "react"
import { KeyIcon } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { Permission } from "@/lib/auth/rbac-plugin"
import {
  TableDefault,
  useServerDataTable,
  type TableDefaultInitialParams,
  type TableFetchFn,
} from "@/components/table-default"
import { columns } from "./columns"

type ListPermissionsQuery = NonNullable<
  Parameters<typeof authClient.rbac.listPermissions>[0]
>["query"]

const DEFAULT_COLUMN_VISIBILITY = {
  name: true,
  key: true,
  isActive: true,
  createdAt: false,
  updatedAt: true,
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

const FILTERS = [
  {
    columnId: "isActive",
    title: "Status",
    options: [
      { label: "Active", value: "true" },
      { label: "Inactive", value: "false" },
    ],
  },
]

export default function PermissionsTable({
  initialParams,
}: {
  initialParams: TableDefaultInitialParams
}) {
  const fetchData = useCallback<TableFetchFn<Permission>>(
    async ({ pageIndex, pageSize, sorting, search, filters }) => {
      const queryParams: ListPermissionsQuery = {
        limit: pageSize,
        offset: pageIndex * pageSize,
      }

      if (search) {
        queryParams.searchValue = search
        queryParams.searchField = "key"
        queryParams.searchOperator = "contains"
      }

      const filterList = Object.entries(filters)
        .map(([field, values]) => ({
          field,
          operator: values.length > 1 ? "in" : "eq",
          value: values.length > 1 ? values : values[0],
        }))
        .filter((f) => f.value !== undefined && f.value !== "")

      if (filterList.length > 0) {
        queryParams.filters = JSON.stringify(filterList)
      }

      if (sorting.length > 0) {
        queryParams.sortBy = sorting[0].id
        queryParams.sortDirection = sorting[0].desc ? "desc" : "asc"
      }

      const { data, error } = await authClient.rbac.listPermissions({
        query: queryParams,
      })

      if (error) {
        throw error
      }

      return {
        rows: data.permissions || [],
        total: data.total || 0,
      }
    },
    [],
  )

  const { table, loading, searchInput, handleClearSearch, handleSearchChange } =
    useServerDataTable<Permission>({
      columns,
      fetchData,
      getRowId: (row) => row.id,
      initialParams,
      defaultColumnVisibility: DEFAULT_COLUMN_VISIBILITY,
      sortableColumns: SORTABLE_COLUMNS,
    })

  return (
    <TableDefault<Permission>
      table={table}
      loading={loading}
      searchInput={searchInput}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearSearch}
      searchPlaceholder="Search key…"
      filters={FILTERS}
      emptyState={{ entityLabel: "permissions", icon: KeyIcon }}
    />
  )
}
