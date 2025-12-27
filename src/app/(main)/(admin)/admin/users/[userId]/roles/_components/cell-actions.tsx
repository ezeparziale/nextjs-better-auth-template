"use client"

import Link from "next/link"
import { useState } from "react"
import { CopyIcon, EyeIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Role } from "@/lib/auth/rbac-plugin"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import RemoveRoleDialog from "./remove-role-dialog"

export default function CellActions({ row, userId }: { row: Role; userId: string }) {
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(row.id)
              toast.info("ID copied to clipboard")
            }}
          >
            <CopyIcon /> Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/roles/${row.id}/settings`} prefetch>
              <EyeIcon />
              View role
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              setIsRemoveDialogOpen(true)
            }}
          >
            <Trash2Icon />
            Remove from user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RemoveRoleDialog
        key={`remove-role-${row.id}`}
        userId={userId}
        roleId={row.id}
        roleName={row.name}
        isOpen={isRemoveDialogOpen}
        setIsOpen={setIsRemoveDialogOpen}
      />
    </>
  )
}
