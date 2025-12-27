"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Shield } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { Role } from "@/lib/auth/rbac-plugin"
import {
  DataTableLoading,
  DataTableLoadingRow,
  DataTableNoData,
  DataTablePagination,
  DataTableSearch,
  DataTableSearchNotFound,
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
import { columns } from "./columns"

type QueryParams = {
  searchValue?: string | undefined
  searchField?: "key" | "name" | undefined
  searchOperator?: "contains" | "starts_with" | "ends_with" | undefined
  limit?: string | number | undefined
  offset?: string | number | undefined
  sortBy?: string | undefined
  sortDirection?: "asc" | "desc" | undefined
  filterField?: string | undefined
  filterValue?: string | number | boolean | undefined
  filterOperator?: "contains" | "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | undefined
}

type InitialParams = {
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
}

const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  name: true,
  key: true,
  isActive: true,
  createdAt: false,
  updatedAt: true,
  createdBy: false,
  updatedBy: false,
}

export default function RolesTable({
  initialParams,
}: {
  initialParams: InitialParams
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [data, setData] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const [searchInput, setSearchInput] = useState(initialParams.search || "")
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
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    DEFAULT_COLUMN_VISIBILITY,
  )
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

  useEffect(() => {
    if (shouldResetPagination > 0) {
      setPagination((prev) => ({ ...prev, pageIndex: 0 }))
    }
  }, [shouldResetPagination])

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
          queryParams.searchField = "key"
          queryParams.searchOperator = "contains"
        }

        if (sorting.length > 0) {
          queryParams.sortBy = sorting[0].id
          queryParams.sortDirection = sorting[0].desc ? "desc" : "asc"
        }

        const { data, error } = await authClient.rbac.listRoles({
          query: queryParams,
        })

        if (error) {
          console.error("Error fetching roles:", error)
          return
        }

        setData(data.roles || [])
        setTotal(data.total || 0)
      } catch (err) {
        console.error("Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [pagination.pageIndex, pagination.pageSize, searchInput, sorting, refreshKey])

  useEffect(() => {
    const params = new URLSearchParams()

    if (searchInput) {
      params.set("search", searchInput)
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
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    pathname,
    router,
    searchParams,
  ])

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(total / pagination.pageSize),
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

  if (loading && data.length === 0) {
    return <DataTableLoading table={table} rowCount={pagination.pageSize} />
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <DataTableSearch
          value={searchInput}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
          placeholder="Search key…"
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
                      title={`No roles found with "${searchInput}"`}
                      handleClearSearch={handleClearSearch}
                      Icon={Shield}
                    />
                  ) : (
                    <DataTableNoData
                      title="No roles found"
                      description="There are no roles to display"
                      Icon={Shield}
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
