import { useState } from "react"
import { UserWithRole } from "better-auth/plugins/admin"
import { BanIcon, MoreHorizontalIcon, Trash2Icon, UserCogIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import BanUserDialog from "./ban-user-dialog"
import DeleteUserDialog from "./delete-user-dialog"

export default function CellActions({ row }: { row: UserWithRole }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isBanUserDialogOpen, setIsBanUserDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon className="size-4" />
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
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <UserCogIcon className="size-4" />
            Edit user
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setIsBanUserDialogOpen(true)
            }}
          >
            <BanIcon className="size-4" />
            {row.banned ? "Unban" : "Ban"} user
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              setIsDeleteDialogOpen(true)
            }}
          >
            <Trash2Icon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DeleteUserDialog
        key={`delete-user-${row.id}`}
        userId={row.id}
        userEmail={row.email}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
      />
      <BanUserDialog
        key={`ban-user-${row.id}`}
        userId={row.id}
        userEmail={row.email}
        isBanned={!!row.banned}
        isOpen={isBanUserDialogOpen}
        setIsOpen={setIsBanUserDialogOpen}
      />
    </>
  )
}
