"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import DeleteRoleDialog from "./delete-role-dialog"

export default function DeleteRoleButton({
  roleId,
  roleKey,
}: {
  roleId: string
  roleKey: string
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            aria-label="Delete role"
          >
            <Trash2Icon aria-hidden="true" className="size-4" />
            <span className="hidden md:inline">Delete role</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="md:hidden" align="end">
          Delete role
        </TooltipContent>
      </Tooltip>
      <DeleteRoleDialog
        roleId={roleId}
        roleKey={roleKey}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        goToTableAfterDelete
      />
    </>
  )
}
