"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader, dataTableFeatures } from "@/components/ui/data-table"
import { DateDescription } from "@/components/date-description"
import InvitationCellActions from "./invitation-cell-actions"

export type InvitationRow = {
  id: string
  email: string
  status: string
  invitedBy: string | null
  invitedById: string | null
  invitedAt: Date
  expiresAt: Date
  acceptedAt: Date | null
  userId: string | null
  effectiveStatus: string
}

const columnHelper = createColumnHelper<typeof dataTableFeatures, InvitationRow>()

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="info-subtle" className="capitalize">
          {status}
        </Badge>
      )
    case "accepted":
      return (
        <Badge variant="success-subtle" className="capitalize">
          {status}
        </Badge>
      )
    case "revoked":
      return (
        <Badge variant="gray-subtle" className="capitalize">
          {status}
        </Badge>
      )
    case "expired":
      return (
        <Badge variant="warning-subtle" className="capitalize">
          {status}
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="capitalize">
          {status}
        </Badge>
      )
  }
}

export const invitationsColumns = columnHelper.columns([
  columnHelper.accessor("email", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    enableHiding: false,
  }),
  columnHelper.accessor("effectiveStatus", {
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => <StatusBadge status={row.getValue("effectiveStatus")} />,
    enableHiding: false,
    meta: {
      displayName: "Status",
    },
  }),
  columnHelper.accessor("invitedAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invited date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("invitedAt"))
      return <DateDescription date={date} />
    },
    enableHiding: false,
    meta: {
      displayName: "Invited date",
    },
  }),
  columnHelper.accessor("expiresAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Expiry date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("expiresAt"))
      return <DateDescription date={date} />
    },
    enableHiding: false,
    meta: {
      displayName: "Expiry date",
    },
  }),
  columnHelper.accessor("invitedBy", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Invited by" />
    ),
    cell: ({ row }) => {
      const invitedBy = row.getValue("invitedBy") as string | null
      return <span className="text-sm">{invitedBy || "-"}</span>
    },
    enableHiding: false,
    meta: {
      displayName: "Invited by",
    },
  }),
  columnHelper.display({
    id: "actions",
    enableHiding: false,
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <InvitationCellActions row={row.original} />,
  }),
])
