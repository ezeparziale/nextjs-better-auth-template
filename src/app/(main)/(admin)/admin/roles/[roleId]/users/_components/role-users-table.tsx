"use client"

import { useCallback, useMemo, useState } from "react"
import { KeyIcon, MinusIcon } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { User } from "@/lib/auth/rbac-plugin"
import { Button } from "@/components/ui/button"
import {
  TableDefault,
  useServerDataTable,
  type TableDefaultInitialParams,
  type TableFetchFn,
} from "@/components/table-default"
import { getColumns } from "./columns"
import RemoveUsersDialog from "./remove-users-dialog"

type ListRoleUsersQuery = Omit<
  NonNullable<Parameters<typeof authClient.rbac.getRoleUsers>[0]>["query"],
  "roleId"
>

const DEFAULT_COLUMN_VISIBILITY = {
  name: true,
  email: true,
  banned: true,
  createdAt: false,
  updatedAt: false,
}

const SORTABLE_COLUMNS = ["name", "email", "banned", "createdAt", "updatedAt"]

export default function RoleUsersTable({
  initialParams,
  roleId,
}: {
  initialParams: TableDefaultInitialParams
  roleId: string
}) {
  const [isRemoveUsersOpen, setIsRemoveUsersOpen] = useState(false)

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
      enableSelection: true,
      defaultSorting: [],
    })

  const selectedUserIds = table.getSelectedRowModel().rows.map((row) => row.original.id)

  return (
    <>
      <TableDefault<User>
        table={table}
        loading={loading}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        searchPlaceholder="Search email…"
        enableSelection
        selectedActions={
          <Button
            size="sm"
            type="button"
            variant="destructive"
            disabled={selectedUserIds.length === 0}
            onClick={() => setIsRemoveUsersOpen(true)}
          >
            <MinusIcon />
            Remove
          </Button>
        }
        emptyState={{ entityLabel: "users", icon: KeyIcon }}
      />
      <RemoveUsersDialog
        roleId={roleId}
        userIds={selectedUserIds}
        isOpen={isRemoveUsersOpen}
        setIsOpen={setIsRemoveUsersOpen}
        onCompleted={() => table.resetRowSelection()}
      />
    </>
  )
}
