"use client"

import { useState } from "react"
import { Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import DeleteUserDialog from "./delete-user-dialog"

export default function DeleteUserButton({
  userId,
  userEmail,
}: {
  userId: string
  userEmail: string
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            aria-label="Delete user"
          >
            <Trash2Icon aria-hidden="true" className="size-4" />
            <span className="hidden md:inline">Delete user</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="md:hidden" align="end">
          Delete user
        </TooltipContent>
      </Tooltip>
      <DeleteUserDialog
        userId={userId}
        userEmail={userEmail}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
      />
    </>
  )
}
