"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { LockIcon } from "lucide-react"
import { Permission } from "@/lib/auth/rbac-plugin/types"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader, dataTableFeatures } from "@/components/ui/data-table"
import CellActions from "./cell-actions"

const columnHelper = createColumnHelper<typeof dataTableFeatures, Permission>()

export const getColumns = (roleId: string, disabled = false) =>
  columnHelper.columns([
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
      meta: {
        displayName: "Active",
      },
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => (
        <CellActions row={row.original} roleId={roleId} disabled={disabled} />
      ),
    }),
  ])
