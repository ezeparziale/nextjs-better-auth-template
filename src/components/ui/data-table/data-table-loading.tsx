"use client"

import { Table as TanstackTable } from "@tanstack/react-table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableLoadingProps<TData> {
  table: TanstackTable<TData>
  rowCount?: number
}

export function DataTableLoading<TData>({
  table,
  rowCount = 10,
}: DataTableLoadingProps<TData>) {
  const visibleColumns = table.getVisibleFlatColumns()

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-[250px]" />
        <Skeleton className="h-8 w-[100px]" />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((col) => (
                <TableHead key={col.id}>
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, i) => (
              <TableRow key={i}>
                {visibleColumns.map((col) => (
                  <TableCell key={col.id}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-4 w-[120px]" />
        <div className="flex items-center space-x-6 lg:space-x-8">
          <Skeleton className="h-8 w-[120px]" />
          <Skeleton className="h-5 w-[100px]" />
          <div className="flex items-center space-x-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
