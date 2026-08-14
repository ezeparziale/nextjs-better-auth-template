"use client"

import type { RowData, Table } from "@tanstack/react-table"
import { Skeleton } from "@/components/ui/skeleton"
import { TableCell, TableRow } from "@/components/ui/table"
import { DataTableFeatures } from "./features"

interface DataTableLoadingRowProps<TData extends RowData> {
  table: Table<DataTableFeatures, TData>
  rowCount?: number
}

export function DataTableLoadingRow<TData extends RowData>({
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
