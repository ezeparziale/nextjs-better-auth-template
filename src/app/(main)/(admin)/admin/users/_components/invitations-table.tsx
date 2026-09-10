"use client"

import { useCallback, useState } from "react"
import { MailIcon, UserPlusIcon } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  TableDefault,
  useServerDataTable,
  type TableDefaultInitialParams,
  type TableFetchFn,
  type TableFilter,
} from "@/components/table-default"
import { invitationsColumns, type InvitationRow } from "./invitations-columns"
import InviteUserDialog from "./invite-user-dialog"

type ListInvitationsQuery = NonNullable<
  Parameters<typeof authClient.invitation.list>[0]
>["query"]

type InvitationStatus = NonNullable<ListInvitationsQuery["status"]>

const RESERVED_PARAMS = ["tab"]

const SORTABLE_COLUMNS = [
  "email",
  "effectiveStatus",
  "invitedAt",
  "expiresAt",
  "invitedBy",
]

const FILTERS: TableFilter[] = [
  {
    columnId: "effectiveStatus",
    title: "Status",
    single: true,
    options: [
      { label: "Pending", value: "pending" },
      { label: "Revoked", value: "revoked" },
      { label: "Accepted", value: "accepted" },
      { label: "Expired", value: "expired" },
    ],
  },
]

export default function InvitationsTable({
  initialParams,
}: {
  initialParams: TableDefaultInitialParams
}) {
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const fetchData = useCallback<TableFetchFn<InvitationRow>>(
    async ({ pageIndex, pageSize, sorting, search, filters }) => {
      const queryParams: ListInvitationsQuery = {
        limit: pageSize,
        offset: pageIndex * pageSize,
        status: (filters.effectiveStatus?.[0] ?? "all") as InvitationStatus,
      }

      if (search) {
        queryParams.searchValue = search
      }

      if (sorting.length > 0) {
        queryParams.sortBy = sorting[0].id
        queryParams.sortDirection = sorting[0].desc ? "desc" : "asc"
      }

      const { data, error } = await authClient.invitation.list({
        query: queryParams,
      })

      if (error) {
        throw error
      }

      return {
        rows: data.invitations || [],
        total: data.total || 0,
      }
    },
    [],
  )

  const { table, loading, searchInput, handleClearSearch, handleSearchChange } =
    useServerDataTable<InvitationRow>({
      columns: invitationsColumns,
      fetchData,
      getRowId: (row) => row.id,
      initialParams,
      reservedParams: RESERVED_PARAMS,
      sortableColumns: SORTABLE_COLUMNS,
      defaultSorting: [{ id: "invitedAt", desc: true }],
    })

  return (
    <>
      <TableDefault<InvitationRow>
        table={table}
        loading={loading}
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        searchPlaceholder="Search email…"
        filters={FILTERS}
        enableColumnVisibility={false}
        toolbarActions={
          <Button size="sm" onClick={() => setIsInviteOpen(true)}>
            <UserPlusIcon aria-hidden="true" />
            <span className="hidden md:inline">Invite user</span>
          </Button>
        }
        emptyState={{ entityLabel: "invitations", icon: MailIcon }}
      />
      <InviteUserDialog isOpen={isInviteOpen} setIsOpen={setIsInviteOpen} />
    </>
  )
}
