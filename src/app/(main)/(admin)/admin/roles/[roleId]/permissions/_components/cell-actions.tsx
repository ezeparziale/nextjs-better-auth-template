"use client"

import Link from "next/link"
import { useState } from "react"
import { CopyIcon, EyeIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { Permission } from "@/lib/auth/rbac-plugin"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import RemovePermissionDialog from "./remove-permission-dialog"

export default function CellActions({
  row,
  roleId,
}: {
  row: Permission
  roleId: string
}) {
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
            <Link href={`/admin/permissions/${row.id}`} prefetch>
              <EyeIcon />
              View permission
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
            Remove from role
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RemovePermissionDialog
        key={`remove-permission-${row.id}`}
        roleId={roleId}
        permissionId={row.id}
        permissionKey={row.key}
        isOpen={isRemoveDialogOpen}
        setIsOpen={setIsRemoveDialogOpen}
      />
    </>
  )
}
