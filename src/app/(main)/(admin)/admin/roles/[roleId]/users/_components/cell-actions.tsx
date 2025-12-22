"use client"

import Link from "next/link"
import { useState } from "react"
import { CopyIcon, EyeIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { User } from "@/lib/auth/rbac-plugin"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import RemoveUserDialog from "./remove-user-dialog"

export default function CellActions({ row, roleId }: { row: User; roleId: string }) {
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 p-0">
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
            <Link href={`/admin/users/${row.id}`} prefetch>
              <EyeIcon />
              View user
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
      <RemoveUserDialog
        key={`remove-user-${row.id}`}
        roleId={roleId}
        userId={row.id}
        userEmail={row.email}
        isOpen={isRemoveDialogOpen}
        setIsOpen={setIsRemoveDialogOpen}
      />
    </>
  )
}
