"use client"

import * as React from "react"
import { ColumnDef, Table as TanstackTable } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export function createSelectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: "select",
    header: ({ table }) => {
      return (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      )
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    size: 40,
  }
}

interface DataTableSelectedActionsProps<TData> {
  table: TanstackTable<TData>
  children?: React.ReactNode
}

export function DataTableSelectedActions<TData>({
  table,
  children,
}: DataTableSelectedActionsProps<TData>) {
  const selectedCount = table.getSelectedRowModel().rows.length

  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      {selectedCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => table.resetRowSelection()}
          type="button"
        >
          Clear
        </Button>
      )}
    </div>
  )
}
