"use client"

import type { ReactNode } from "react"
import { flexRender } from "@tanstack/react-table"
import type { RowData, Table as TableType } from "@tanstack/react-table"
import { XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DataTableFacetedFilter,
  DataTableLoading,
  DataTableLoadingRow,
  DataTableNoData,
  DataTablePagination,
  DataTableSearch,
  DataTableSearchNotFound,
  DataTableSelectedActions,
  DataTableViewOptions,
} from "@/components/ui/data-table"
import type { DataTableFeatures } from "@/components/ui/data-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { TableEmptyState, TableFilter } from "./types"

interface TableDefaultProps<TData extends RowData> {
  table: TableType<DataTableFeatures, TData>
  loading: boolean
  searchInput: string
  onSearchChange: (value: string) => void
  onClearSearch: () => void

  enableSearch?: boolean
  searchPlaceholder?: string

  enableColumnVisibility?: boolean
  filters?: TableFilter[]

  enableSelection?: boolean
  selectedActions?: ReactNode

  onRowClick?: (row: TData) => void

  emptyState: TableEmptyState
}

export function TableDefault<TData extends RowData>({
  table,
  loading,
  searchInput,
  onSearchChange,
  onClearSearch,
  enableSearch = true,
  searchPlaceholder = "Search…",
  enableColumnVisibility = true,
  filters = [],
  enableSelection = false,
  selectedActions,
  onRowClick,
  emptyState,
}: TableDefaultProps<TData>) {
  const isFiltered = filters.some(
    (filter) => table.getColumn(filter.columnId)?.getFilterValue() != null,
  )
  const hasSelection = enableSelection && selectedActions !== undefined
  const totalColumns = table.getVisibleLeafColumns().length

  if (loading && table.getRowModel().rows.length === 0) {
    return (
      <DataTableLoading
        table={table}
        rowCount={table.atoms.pagination.get().pageSize}
      />
    )
  }

  const handleRowClick =
    (row: TData) => (event: React.MouseEvent<HTMLTableRowElement>) => {
      if (!onRowClick) return
      const target = event.target as HTMLElement
      if (target.closest("a, button, input, [data-skip-row-click]")) return
      onRowClick(row)
    }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        {enableSearch && (
          <div className="md:hidden">
            <DataTableSearch
              value={searchInput}
              onChange={onSearchChange}
              onClear={onClearSearch}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 md:flex-1">
          {enableSearch && (
            <div className="hidden md:block">
              <DataTableSearch
                value={searchInput}
                onChange={onSearchChange}
                onClear={onClearSearch}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          {filters.map((filter) => {
            const column = table.getColumn(filter.columnId)
            if (!column) return null
            return (
              <DataTableFacetedFilter
                key={filter.columnId}
                column={column}
                title={filter.title}
                options={filter.options}
              />
            )
          })}
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
          {hasSelection && (
            <DataTableSelectedActions table={table}>
              {selectedActions}
            </DataTableSelectedActions>
          )}
          {enableColumnVisibility && <DataTableViewOptions table={table} />}
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
                rowCount={Math.min(table.atoms.pagination.get().pageSize, 5)}
              />
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={onRowClick ? "cursor-pointer" : undefined}
                  onClick={handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={totalColumns} className="h-24 text-center">
                  {searchInput ? (
                    <DataTableSearchNotFound
                      title={`No ${emptyState.entityLabel} found with "${searchInput}"`}
                      handleClearSearch={onClearSearch}
                      Icon={emptyState.icon}
                    />
                  ) : (
                    <DataTableNoData
                      title={`No ${emptyState.entityLabel} found`}
                      description={`There are no ${emptyState.entityLabel} to display`}
                      Icon={emptyState.icon}
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
