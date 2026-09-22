"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { LockIcon } from "lucide-react"
import { Role } from "@/lib/auth/rbac-plugin"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader, dataTableFeatures } from "@/components/ui/data-table"
import { DateDescription } from "@/components/date-description"
import CellActions from "./cell-actions"

const columnHelper = createColumnHelper<typeof dataTableFeatures, Role>()

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  }),
  columnHelper.accessor("key", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Key" />,
    cell: ({ row }) => {
      const isSystem = row.original.isSystem
      const key = row.getValue("key") as string

      return (
        <Badge variant="secondary" className="gap-1 font-mono">
          {isSystem && <LockIcon />}
          {key}
        </Badge>
      )
    },
  }),
  columnHelper.accessor("isActive", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Active" />,
    cell: ({ row }) => {
      const isActive = row.getValue("isActive")

      return (
        <Badge variant={isActive ? "green-subtle" : "red-subtle"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      )
    },
  }),
  columnHelper.accessor("assignOnJoin", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Auto-assign" />
    ),
    cell: ({ row }) => {
      const assignOnJoin = row.getValue("assignOnJoin")

      return (
        <Badge variant={assignOnJoin ? "blue-subtle" : "secondary"}>
          {assignOnJoin ? "On join" : "Manual"}
        </Badge>
      )
    },
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created at" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <DateDescription date={date} />
    },
  }),
  columnHelper.accessor("updatedAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated at" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"))
      return <DateDescription date={date} />
    },
  }),
  columnHelper.accessor("createdBy", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created By" />
    ),
  }),
  columnHelper.accessor("updatedBy", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated By" />
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <CellActions row={row.original} />,
  }),
])
