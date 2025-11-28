"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Permission } from "@/lib/auth/rbac-plugin"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { DateDescription } from "@/components/date-description"
import CellActions from "./cell-actions"

export const columns: ColumnDef<Permission>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "key",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Key" />,
    cell: ({ row }) => {
      return <Badge variant="secondary">{row.getValue("key")}</Badge>
    },
  },
  {
    accessorKey: "isActive",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Active" />,
    cell: ({ row }) => {
      const isActive = row.getValue("isActive")

      return (
        <Badge variant={isActive ? "green-subtle" : "red-subtle"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created at" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <DateDescription date={date} />
    },
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated at" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"))
      return <DateDescription date={date} />
    },
  },
  {
    accessorKey: "createdBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created By" />
    ),
  },
  {
    accessorKey: "updatedBy",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated By" />
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <CellActions row={row.original} />,
  },
]
