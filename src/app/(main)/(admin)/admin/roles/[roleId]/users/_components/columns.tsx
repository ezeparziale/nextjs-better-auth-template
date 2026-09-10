"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { User } from "@/lib/auth/rbac-plugin/types"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader, dataTableFeatures } from "@/components/ui/data-table"
import CellActions from "./cell-actions"

const columnHelper = createColumnHelper<typeof dataTableFeatures, User>()

export const getColumns = (roleId: string) =>
  columnHelper.columns([
    columnHelper.accessor("name", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    }),
    columnHelper.accessor("email", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    }),
    columnHelper.accessor("banned", {
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const banned = row.getValue("banned") as boolean | undefined
        return (
          <Badge variant={banned ? "red-subtle" : "green-subtle"}>
            {banned ? "Banned" : "Active"}
          </Badge>
        )
      },
      meta: {
        displayName: "Status",
      },
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => <CellActions row={row.original} roleId={roleId} />,
    }),
  ])
