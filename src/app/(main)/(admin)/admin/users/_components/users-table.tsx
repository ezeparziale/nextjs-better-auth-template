"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  ColumnFiltersState,
  ColumnVisibilityState,
  flexRender,
  RowSelectionState,
  SortingState,
  useTable,
} from "@tanstack/react-table"
import { UserWithRole } from "better-auth/plugins/admin"
import { ShieldPlusIcon, UserIcon, XIcon } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  createSelectColumn,
  DataTableFacetedFilter,
  DataTableLoading,
  DataTableLoadingRow,
  DataTableNoData,
  dataTableOptions,
  DataTablePagination,
  DataTableSearch,
  DataTableSearchNotFound,
  DataTableSelectedActions,
  DataTableViewOptions,
  useDataTable,
} from "@/components/ui/data-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import BulkAssignRoleDialog from "./bulk-assign-role-dialog"
import { columns } from "./columns"

type QueryParams = {
  searchValue?: string | undefined
  searchField?: "email" | "name" | undefined
  searchOperator?: "contains" | "starts_with" | "ends_with" | undefined
  limit?: string | number | undefined
  offset?: string | number | undefined
  sortBy?: string | undefined
  sortDirection?: "asc" | "desc" | undefined
  filters?: string | undefined
}

type InitialParams = {
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
  [key: string]: string | undefined
}

const DEFAULT_COLUMN_VISIBILITY: ColumnVisibilityState = {
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

const RESERVED_PARAMS = [
  "tab",
  "page",
  "pageSize",
  "search",
  "sortBy",
  "sortDirection",
  "invSearch",
  "invStatus",
]

export default function UsersTable({
  initialParams,
}: {
  initialParams: InitialParams
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [data, setData] = useState<UserWithRole[]>([])
  const [loading, setLoading] = useState(true)

  const [searchInput, setSearchInput] = useState(initialParams.search || "")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    Object.entries(initialParams).forEach(([key, value]) => {
      if (!RESERVED_PARAMS.includes(key) && value) {
        filters.push({
          id: key,
          value: value.split(","),
        })
      }
    })
    return filters
  })
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (initialParams.sortBy) {
      return [
        {
          id: initialParams.sortBy,
          desc: initialParams.sortDirection === "desc",
        },
      ]
    }
    return [
      {
        id: "updatedAt",
        desc: true,
      },
    ]
  })
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(
    DEFAULT_COLUMN_VISIBILITY,
  )
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: initialParams.page ? parseInt(initialParams.page) - 1 : 0,
    pageSize: initialParams.pageSize ? parseInt(initialParams.pageSize) : 10,
  })
  const [total, setTotal] = useState(0)

  const handleClearSearch = () => {
    setSearchInput("")
  }

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const { refreshKey, shouldResetPagination } = useDataTable()
  const [prevShouldReset, setPrevShouldReset] = useState(shouldResetPagination)

  if (shouldResetPagination !== prevShouldReset) {
    setPrevShouldReset(shouldResetPagination)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  useEffect(() => {
    const fetchData = async () => {
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

        if (columnFilters.length > 0) {
          const filters = columnFilters
            .map((filter) => {
              const value = filter.value as string[]
              if (value.length === 0) return null
              return {
                field: filter.id,
                operator: value.length > 1 ? "in" : "eq",
                value: value.length > 1 ? value : value[0],
              }
            })
            .filter(Boolean)
          if (filters.length > 0) {
            queryParams.filters = JSON.stringify(filters)
          }
        }

        if (sorting.length > 0) {
          queryParams.sortBy = sorting[0].id
          queryParams.sortDirection = sorting[0].desc ? "desc" : "asc"
        }

        const { data, error } = await authClient.adminPlus.listUsers({
          query: queryParams,
        })

        if (error) {
          console.error("Error fetching users:", error)
          return
        }

        setData(data.users || [])
        setTotal(data.total || 0)
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
    sorting,
    refreshKey,
    columnFilters,
  ])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const existingTab = params.get("tab")
    params.delete("tab")
    if (existingTab) params.set("tab", existingTab)

    if (searchInput) {
      params.set("search", searchInput)
    }

    if (columnFilters.length > 0) {
      columnFilters.forEach((filter) => {
        if (Array.isArray(filter.value) && filter.value.length > 0) {
          params.set(filter.id, filter.value.join(","))
        }
      })
    }

    if (pagination.pageIndex > 0) {
      params.set("page", String(pagination.pageIndex + 1))
    }
    if (pagination.pageSize !== 10) {
      params.set("pageSize", String(pagination.pageSize))
    }

    if (sorting.length > 0) {
      params.set("sortBy", sorting[0].id)
      params.set("sortDirection", sorting[0].desc ? "desc" : "asc")
    }

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`

    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    if (newUrl !== currentUrl) {
      router.push(newUrl, { scroll: false })
    }
  }, [
    searchInput,
    columnFilters,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    pathname,
    router,
    searchParams,
  ])

  const tableColumns = [createSelectColumn<UserWithRole>(), ...columns]

  const table = useTable({
    ...dataTableOptions,
    data,
    columns: tableColumns,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: {
      pagination,
      sorting,
      columnVisibility,
      columnFilters,
      rowSelection,
    },
    onPaginationChange: (updater) => {
      setPagination(updater)
      setRowSelection({})
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualFiltering: true,
    enableMultiRowSelection: true,
    getRowId: (row) => row.id,
  })

  const isFiltered = table.state.columnFilters.length > 0
  const selectedUserIds = table.getSelectedRowModel().rows.map((row) => row.original.id)

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
          {table.getColumn("banned") && (
            <DataTableFacetedFilter
              column={table.getColumn("banned")}
              title="Status"
              options={[
                { label: "Banned", value: "true" },
                { label: "Active", value: "false" },
              ]}
            />
          )}
          {table.getColumn("emailVerified") && (
            <DataTableFacetedFilter
              column={table.getColumn("emailVerified")}
              title="Email"
              options={[
                {
                  label: "Verified",
                  value: "true",
                },
                {
                  label: "Unverified",
                  value: "false",
                },
              ]}
            />
          )}
          {table.getColumn("role") && (
            <DataTableFacetedFilter
              column={table.getColumn("role")}
              title="Role"
              options={[
                { label: "Admin", value: "admin" },
                { label: "User", value: "user" },
              ]}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetColumnFilters()}
            >
              Reset
              <XIcon />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DataTableSelectedActions table={table}>
            <Button
              size="sm"
              type="button"
              disabled={selectedUserIds.length === 0}
              onClick={() => setIsBulkAssignOpen(true)}
            >
              <ShieldPlusIcon />
              Assign role
            </Button>
          </DataTableSelectedActions>
          <DataTableViewOptions table={table} />
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {searchInput ? (
                    <DataTableSearchNotFound
                      title={`No users found with "${searchInput}"`}
                      handleClearSearch={handleClearSearch}
                      Icon={UserIcon}
                    />
                  ) : (
                    <DataTableNoData
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
      <BulkAssignRoleDialog
        userIds={selectedUserIds}
        isOpen={isBulkAssignOpen}
        setIsOpen={setIsBulkAssignOpen}
        onCompleted={() => setRowSelection({})}
      />
    </div>
  )
}
