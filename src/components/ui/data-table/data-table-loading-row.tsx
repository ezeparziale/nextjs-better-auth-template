"use client"

import { Table as TanstackTable } from "@tanstack/react-table"
import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"

interface DataTableLoadingRowProps<TData> {
  table: TanstackTable<TData>
  rowCount?: number
}

export function DataTableLoadingRow<TData>({
  table,
  rowCount = 3,
}: DataTableLoadingRowProps<TData>) {
  const visibleColumns = table.getVisibleFlatColumns()

  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={`loading-row-${rowIndex}`} className="animate-pulse">
          {visibleColumns.map((column) => (
            <TableCell key={column.id}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
