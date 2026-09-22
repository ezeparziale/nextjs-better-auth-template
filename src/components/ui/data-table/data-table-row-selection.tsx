"use client"

import * as React from "react"
import type { ColumnDef, RowData, Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableFeatures, dataTableFeatures } from "./features"

export function createSelectColumn<TData extends RowData>(options?: {
  getRowCanSelect?: (row: TData) => boolean
}): ColumnDef<typeof dataTableFeatures, TData, unknown> {
  const canSelect = (row: { original: TData }) =>
    options?.getRowCanSelect ? options.getRowCanSelect(row.original) : true

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
    cell: ({ row }) => {
      const disabled = !canSelect(row)

      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          disabled={disabled}
        />
      )
    },
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
  }
}

interface DataTableSelectedActionsProps<TData extends RowData> {
  table: Table<DataTableFeatures, TData>
  children?: React.ReactNode
}

export function DataTableSelectedActions<TData extends RowData>({
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
