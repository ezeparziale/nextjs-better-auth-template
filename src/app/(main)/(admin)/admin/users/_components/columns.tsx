"use client"

import { ColumnDef } from "@tanstack/react-table"
import { UserWithRole } from "better-auth/plugins/admin"
import { CheckIcon, XIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DataTableColumnHeader } from "@/components/ui/data-table"
import { DateDescription } from "@/components/date-description"
import CellActions from "./cell-actions"

export const columns: ColumnDef<UserWithRole>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => {
      const name = row.original.name ?? ""
      const image = row.original.image ?? ""

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={image} alt={name} />
            <AvatarFallback className="text-xs">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{name || "-"}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
  },
  {
    accessorKey: "emailVerified",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email verified" />
    ),
    cell: ({ row }) => {
      const verified = row.getValue("emailVerified") as boolean
      return (
        <div className="flex items-center pl-4">
          {verified ? (
            <div className="flex size-6 items-center justify-center rounded-md bg-emerald-500/15">
              <CheckIcon className="size-3.5 text-emerald-600" />
            </div>
          ) : (
            <div className="flex size-6 items-center justify-center rounded-md bg-zinc-500/15">
              <XIcon className="size-3.5 text-zinc-500" />
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.getValue("role") as string

      return (
        <Badge variant="secondary" className="capitalize">
          {role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "banned",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const banned = row.getValue("banned") as boolean | undefined
      return (
        <Badge variant={banned ? "red-subtle" : "green-subtle"}>
          {banned ? "Banned" : "Active"}
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
