import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  CopyIcon,
  CopyPlusIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
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
import CloneRoleDialog from "./clone-role-dialog"
import DeleteRoleDialog from "./delete-role-dialog"

export default function CellActions({ row }: { row: Role }) {
  const router = useRouter()
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
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
          <DropdownMenuItem
            onClick={() => router.push(`/admin/roles/${row.id}/settings`)}
          >
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              setIsCloneDialogOpen(true)
            }}
          >
            <CopyPlusIcon />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => {
              setIsDeleteDialogOpen(true)
            }}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CloneRoleDialog
        key={`clone-role-${row.id}`}
        role={row}
        isOpen={isCloneDialogOpen}
        setIsOpen={setIsCloneDialogOpen}
      />
      <DeleteRoleDialog
        key={`delete-role-${row.id}`}
        roleId={row.id}
        roleKey={row.key}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
      />
    </>
  )
}
