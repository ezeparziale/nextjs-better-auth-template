"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { User } from "@/lib/auth/rbac-plugin/types"
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
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => <CellActions row={row.original} roleId={roleId} />,
    }),
  ])
