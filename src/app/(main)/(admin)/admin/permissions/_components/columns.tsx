"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { LockIcon } from "lucide-react"
import { Permission } from "@/lib/auth/rbac-plugin"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader, dataTableFeatures } from "@/components/ui/data-table"
import { DateDescription } from "@/components/date-description"
import CellActions from "./cell-actions"

const columnHelper = createColumnHelper<typeof dataTableFeatures, Permission>()

export const columns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    meta: {
      displayName: "Name",
    },
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
    meta: {
      displayName: "Key",
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
    meta: {
      displayName: "Active",
    },
  }),
  columnHelper.accessor("isSystem", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="System" />,
    cell: ({ row }) => {
      const isSystem = row.getValue("isSystem")

      return (
        <Badge variant={isSystem ? "secondary" : "outline"}>
          {isSystem ? "System" : "User-created"}
        </Badge>
      )
    },
    meta: {
      displayName: "System",
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
    meta: {
      displayName: "Created at",
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
    meta: {
      displayName: "Updated at",
    },
  }),
  columnHelper.accessor("createdBy", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created By" />
    ),
    meta: {
      displayName: "Created By",
    },
  }),
  columnHelper.accessor("updatedBy", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated By" />
    ),
    meta: {
      displayName: "Updated By",
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <CellActions row={row.original} />,
  }),
])
