"use client"

import { useCallback, useState } from "react"
import type { UserWithRole } from "better-auth/plugins/admin"
import { ShieldPlusIcon, UserIcon } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  TableDefault,
  useServerDataTable,
  type TableDefaultInitialParams,
  type TableFetchFn,
  type TableFilter,
} from "@/components/table-default"
import BulkAssignRoleDialog from "./bulk-assign-role-dialog"
import { columns } from "./columns"

type ListUsersQuery = NonNullable<
  Parameters<typeof authClient.adminPlus.listUsers>[0]
>["query"]

type UserWithRoleRow = UserWithRole & {
  createdBy?: string | null
  updatedBy?: string | null
}

const DEFAULT_COLUMN_VISIBILITY = {
  name: true,
  email: true,
  emailVerified: true,
  banned: true,
  role: true,
  createdAt: false,
  updatedAt: true,
  createdBy: false,
  updatedBy: false,
}

const RESERVED_PARAMS = ["tab"]

const SORTABLE_COLUMNS = [
  "name",
  "email",
  "emailVerified",
  "role",
  "banned",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
]

const FILTERS: TableFilter[] = [
  {
    columnId: "banned",
    title: "Status",
    options: [
      { label: "Banned", value: "true" },
      { label: "Active", value: "false" },
    ],
  },
  {
    columnId: "emailVerified",
    title: "Email",
    options: [
      { label: "Verified", value: "true" },
      { label: "Unverified", value: "false" },
    ],
  },
  {
    columnId: "role",
    title: "Role",
    options: [
      { label: "Admin", value: "admin" },
      { label: "User", value: "user" },
    ],
  },
]

export default function UsersTable({
  initialParams,
}: {
  initialParams: TableDefaultInitialParams
}) {
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false)

  const fetchData = useCallback<TableFetchFn<UserWithRoleRow>>(
    async ({ pageIndex, pageSize, sorting, search, filters }) => {
      const queryParams: ListUsersQuery = {
        limit: pageSize,
        offset: pageIndex * pageSize,
      }

      if (search) {
        queryParams.searchValue = search
        queryParams.searchField = "email"
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

      const { data, error } = await authClient.adminPlus.listUsers({
        query: queryParams,
      })

      if (error) {
        throw error
      }

      return {
        rows: data.users || [],
        total: data.total || 0,
      }
    },
    [],
  )

  const { table, loading, searchInput, handleClearSearch, handleSearchChange } =
    useServerDataTable<UserWithRoleRow>({
      columns,
      fetchData,
      getRowId: (row) => row.id,
      initialParams,
      defaultColumnVisibility: DEFAULT_COLUMN_VISIBILITY,
      sortableColumns: SORTABLE_COLUMNS,
      reservedParams: RESERVED_PARAMS,
      enableSelection: true,
    })

  const selectedUserIds = table.getSelectedRowModel().rows.map((row) => row.original.id)

  return (
    <>
      <TableDefault<UserWithRoleRow>
        table={table}
        loading={loading}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        searchPlaceholder="Search email…"
        filters={FILTERS}
        enableSelection
        selectedActions={
          <Button
            size="sm"
            type="button"
            disabled={selectedUserIds.length === 0}
            onClick={() => setIsBulkAssignOpen(true)}
          >
            <ShieldPlusIcon />
            Assign role
          </Button>
        }
        emptyState={{ entityLabel: "users", icon: UserIcon }}
      />
      <BulkAssignRoleDialog
        userIds={selectedUserIds}
        isOpen={isBulkAssignOpen}
        setIsOpen={setIsBulkAssignOpen}
        onCompleted={() => table.resetRowSelection()}
      />
    </>
  )
}
