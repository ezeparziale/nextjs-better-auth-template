"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@/lib/auth/rbac-plugin/types"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import CellActions from "./cell-actions"

export const getColumns = (roleId: string): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    id: "actions",
    cell: ({ row }) => <CellActions row={row.original} roleId={roleId} />,
  },
]
