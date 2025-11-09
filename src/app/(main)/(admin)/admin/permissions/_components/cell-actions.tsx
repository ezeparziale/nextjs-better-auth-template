import { useRouter } from "next/navigation"
import { useState } from "react"
import { CopyIcon, MoreHorizontalIcon, Trash2Icon, UserCogIcon } from "lucide-react"
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
import DeletePermissionDialog from "./delete-permission-dialog"

export default function CellActions({ row }: { row: Permission }) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
            <CopyIcon className="size-4" /> Copy ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push(`/admin/permissions/${row.id}/settings`)}
          >
            <UserCogIcon className="size-4" />
            Edit
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
      <DeletePermissionDialog
        key={`delete-permission-${row.id}`}
        permissionId={row.id}
        permissionKey={row.key}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
      />
    </>
  )
}
