"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { flexRender, SortingState, useTable } from "@tanstack/react-table"
import { MailIcon, UserPlusIcon, XIcon } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  DataTableLoading,
  DataTableLoadingRow,
  DataTableNoData,
  dataTableOptions,
  DataTablePagination,
  DataTableSearch,
  DataTableSearchNotFound,
  useDataTable,
} from "@/components/ui/data-table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { invitationsColumns, type InvitationRow } from "./invitations-columns"
import InviteUserDialog from "./invite-user-dialog"

type QueryParams = {
  searchValue?: string
  status?: "all" | "pending" | "revoked" | "accepted" | "expired"
  limit?: string | number
  offset?: string | number
  sortBy?: string
  sortDirection?: "asc" | "desc"
}

type InitialParams = {
  invSearch?: string
  invStatus?: string
  [key: string]: string | undefined
}

const STATUS_OPTIONS: {
  value: "all" | "pending" | "revoked" | "accepted" | "expired"
  label: string
}[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "revoked", label: "Revoked" },
  { value: "accepted", label: "Accepted" },
  { value: "expired", label: "Expired" },
]

type StatusFilter = "all" | "pending" | "revoked" | "accepted" | "expired"

export default function InvitationsTable({
  initialParams,
}: {
  initialParams: InitialParams
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [data, setData] = useState<InvitationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(initialParams.invSearch || "")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    STATUS_OPTIONS.some((o) => o.value === initialParams.invStatus)
      ? (initialParams.invStatus as StatusFilter)
      : "all",
  )
  const [sorting, setSorting] = useState<SortingState>(() => [
    { id: "invitedAt", desc: true },
  ])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [total, setTotal] = useState(0)
  const [isInviteOpen, setIsInviteOpen] = useState(false)

  const { refreshKey, shouldResetPagination } = useDataTable()
  const [prevReset, setPrevReset] = useState(shouldResetPagination)

  if (shouldResetPagination !== prevReset) {
    setPrevReset(shouldResetPagination)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleClearSearch = () => setSearchInput("")
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const queryParams: QueryParams = {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
          status: statusFilter,
        }

        if (searchInput.trim()) {
          queryParams.searchValue = searchInput.trim()
        }

        if (sorting.length > 0) {
          queryParams.sortBy = sorting[0].id
          queryParams.sortDirection = sorting[0].desc ? "desc" : "asc"
        }

        const { data: result, error } = await authClient.invitation.list({
          query: queryParams,
        })

        if (error) {
          console.error("Error fetching invitations:", error)
          return
        }

        setData(result.invitations || [])
        setTotal(result.total || 0)
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    searchInput,
    statusFilter,
    sorting,
    refreshKey,
  ])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "invitations")
    if (searchInput) params.set("invSearch", searchInput)
    else params.delete("invSearch")
    if (statusFilter && statusFilter !== "all") params.set("invStatus", statusFilter)
    else params.delete("invStatus")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput, statusFilter])

  const table = useTable({
    ...dataTableOptions,
    data,
    columns: invitationsColumns,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    manualFiltering: true,
    getRowId: (row) => row.id,
  })

  if (loading && data.length === 0) {
    return <DataTableLoading table={table} rowCount={pagination.pageSize} />
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="md:hidden">
          <DataTableSearch
            value={searchInput}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
            placeholder="Search email…"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-1">
          <div className="hidden md:block">
            <DataTableSearch
              value={searchInput}
              onChange={handleSearchChange}
              onClear={handleClearSearch}
              placeholder="Search email…"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as StatusFilter)
              setPagination((prev) => ({ ...prev, pageIndex: 0 }))
            }}
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statusFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all")
                setPagination((prev) => ({ ...prev, pageIndex: 0 }))
              }}
            >
              Reset
              <XIcon />
            </Button>
          )}
          <Button size="sm" className="ml-auto" onClick={() => setIsInviteOpen(true)}>
            <UserPlusIcon aria-hidden="true" />
            <span className="hidden md:inline">Invite user</span>
          </Button>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <DataTableLoadingRow
                table={table}
                rowCount={Math.min(pagination.pageSize, 5)}
              />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={invitationsColumns.length}
                  className="h-24 text-center"
                >
                  {searchInput || statusFilter !== "all" ? (
                    <DataTableSearchNotFound
                      title="No invitations found"
                      handleClearSearch={() => {
                        setSearchInput("")
                        setStatusFilter("all")
                      }}
                      Icon={MailIcon}
                    />
                  ) : (
                    <DataTableNoData
                      title="No invitations"
                      description="There are no invitations to display"
                      Icon={MailIcon}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
      <InviteUserDialog isOpen={isInviteOpen} setIsOpen={setIsInviteOpen} />
    </div>
  )
}
