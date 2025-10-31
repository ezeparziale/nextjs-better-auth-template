"use client"

import { useEffect, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { UserWithRole } from "better-auth/plugins/admin"
import { LucideIcon, UserIcon } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { DataTablePagination } from "@/components/ui/data-table/data-table-pagination"
import { DataTableSearch } from "@/components/ui/data-table/data-table-search"
import { DataTableViewOptions } from "@/components/ui/data-table/data-table-view-options"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { columns } from "./columns"

type QueryParams = {
  searchValue?: string | undefined
  searchField?: "email" | "name" | undefined
  searchOperator?: "contains" | "starts_with" | "ends_with" | undefined
  limit?: string | number | undefined
  offset?: string | number | undefined
  sortBy?: string | undefined
  sortDirection?: "asc" | "desc" | undefined
  filterField?: string | undefined
  filterValue?: string | number | boolean | undefined
  filterOperator?: "contains" | "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | undefined
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  // Visible columns by default
  name: true,
  email: true,
  emailVerified: true,
  createdAt: true,
  // Hidden columns by default
  role: false,
  banned: false,
  image: false,
  updatedAt: false,
}

export default function UsersTable() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_COLUMN_VISIBILITY,
  )
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [totalUsers, setTotalUsers] = useState(0)

  const handleClearSearch = () => {
    setSearchInput("")
  }

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const queryParams: QueryParams = {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
        }

        if (searchInput.trim()) {
          queryParams.searchValue = searchInput.trim()
          queryParams.searchField = "email"
          queryParams.searchOperator = "contains"
        }

        if (sorting.length > 0) {
          queryParams.sortBy = sorting[0].id
          queryParams.sortDirection = sorting[0].desc ? "desc" : "asc"
        }

        const { data, error } = await authClient.admin.listUsers({
          query: queryParams,
        })

        if (error) {
          console.error("Error fetching users:", error)
          return
        }

        setUsers(data.users || [])
        setTotalUsers(data.total || 0)
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [pagination.pageIndex, pagination.pageSize, searchInput, sorting])

  const table = useReactTable({
    data: users,
    columns,
    pageCount: Math.ceil(totalUsers / pagination.pageSize),
    state: {
      pagination,
      sorting,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true,
    autoResetPageIndex: false,
  })

  if (loading && users.length === 0) {
    return (
      <Empty className="w-full border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Spinner />
          </EmptyMedia>
          <EmptyTitle>Loading…</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <DataTableSearch
          value={searchInput}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
          placeholder="Search email…"
        />
        <DataTableViewOptions table={table} />
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
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Spinner />
                </TableCell>
              </TableRow>
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {searchInput ? (
                    <SearchNotFound
                      searchValue={searchInput}
                      handleClearSearch={handleClearSearch}
                      Icon={UserIcon}
                    />
                  ) : (
                    <NoValues
                      title="No users found"
                      description="There are no users to display"
                      Icon={UserIcon}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}

function SearchNotFound({
  searchValue,
  handleClearSearch,
  Icon,
}: {
  searchValue: string
  handleClearSearch: () => void
  Icon: LucideIcon
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{`No users found with "${searchValue}"`}</EmptyTitle>
        <EmptyDescription>Try adjusting your search terms</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={handleClearSearch}>
          Clear search
        </Button>
      </EmptyContent>
    </Empty>
  )
}

function NoValues({
  title,
  description,
  Icon,
}: {
  title: string
  description: string
  Icon: LucideIcon
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
