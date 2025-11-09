"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import DeletePermissionDialog from "./delete-permission-dialog"

export default function DeletePermissionButton({
  permissionId,
  permissionKey,
}: {
  permissionId: string
  permissionKey: string
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            aria-label="Delete permission"
          >
            <Trash2Icon aria-hidden="true" className="size-4" />
            <span className="hidden md:inline">Delete permission</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="md:hidden" align="end">
          Delete permission
        </TooltipContent>
      </Tooltip>
      <DeletePermissionDialog
        permissionId={permissionId}
        permissionKey={permissionKey}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
        goToTableAfterDelete
      />
    </>
  )
}
