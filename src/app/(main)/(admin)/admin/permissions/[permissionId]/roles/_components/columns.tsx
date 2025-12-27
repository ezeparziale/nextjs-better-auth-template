"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Permission } from "@/lib/auth/rbac-plugin/types"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import CellActions from "./cell-actions"

export const getColumns = (permissionId: string): ColumnDef<Permission>[] => [
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
    meta: {
      displayName: "Active",
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions row={row.original} permissionId={permissionId} />,
  },
]
