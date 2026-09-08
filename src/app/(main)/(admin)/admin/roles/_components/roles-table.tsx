"use client"

import { useCallback } from "react"
import { Shield } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { Role } from "@/lib/auth/rbac-plugin"
import {
  TableDefault,
  useServerDataTable,
  type TableDefaultInitialParams,
  type TableFetchFn,
} from "@/components/table-default"
import { columns } from "./columns"

type ListRolesQuery = NonNullable<
  Parameters<typeof authClient.rbac.listRoles>[0]
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

export default function RolesTable({
  initialParams,
}: {
  initialParams: TableDefaultInitialParams
}) {
  const fetchData = useCallback<TableFetchFn<Role>>(
    async ({ pageIndex, pageSize, sorting, search, filters }) => {
      const queryParams: ListRolesQuery = {
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

      const { data, error } = await authClient.rbac.listRoles({
        query: queryParams,
      })

      if (error) {
        throw error
      }

      return {
        rows: data.roles || [],
        total: data.total || 0,
      }
    },
    [],
  )

  const { table, loading, searchInput, handleClearSearch, handleSearchChange } =
    useServerDataTable<Role>({
      columns,
      fetchData,
      getRowId: (row) => row.id,
      initialParams,
      defaultColumnVisibility: DEFAULT_COLUMN_VISIBILITY,
      sortableColumns: SORTABLE_COLUMNS,
    })

  return (
    <TableDefault<Role>
      table={table}
      loading={loading}
      searchInput={searchInput}
      onSearchChange={handleSearchChange}
      onClearSearch={handleClearSearch}
      searchPlaceholder="Search key…"
      filters={FILTERS}
      emptyState={{ entityLabel: "roles", icon: Shield }}
    />
  )
}
