"use client"

import Link from "next/link"
import { useState } from "react"
import { CopyIcon, EyeIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { Role } from "@/lib/auth/rbac-plugin"
import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/components/ui/copy-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import RemoveRoleDialog from "./remove-role-dialog"

export default function CellActions({
  row,
  permissionId,
}: {
  row: Role
  permissionId: string
}) {
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const { copy } = useCopyToClipboard()

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
          <DropdownMenuItem onClick={() => copy(row.id)}>
            <CopyIcon /> Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/roles/${row.id}`} prefetch>
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
            Remove from permission
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RemoveRoleDialog
        key={`remove-role-${row.id}`}
        permissionId={permissionId}
        roleId={row.id}
        roleKey={row.key}
        isOpen={isRemoveDialogOpen}
        setIsOpen={setIsRemoveDialogOpen}
      />
    </>
  )
}
