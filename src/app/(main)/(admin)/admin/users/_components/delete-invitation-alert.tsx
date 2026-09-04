"use client"

import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDataTable } from "@/components/ui/data-table"
import { Spinner } from "@/components/ui/spinner"
import type { InvitationRow } from "./invitations-columns"

export default function DeleteInvitationAlert({
  invitation,
  isOpen,
  setIsOpen,
}: {
  invitation: InvitationRow
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { refreshTable } = useDataTable()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDelete = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await authClient.invitation.delete({
        invitationId: invitation.id,
      })

      if (error) {
        toast.error(error.message || "Failed to delete invitation")
        return
      }

      toast.success(`Invitation deleted for ${invitation.email}`)
      setIsOpen(false)
      refreshTable({ resetPagination: false })
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this invitation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the {invitation.effectiveStatus} invitation for{" "}
            <span className="font-medium">{invitation.email}</span> from the records.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isSubmitting}
            variant="destructive"
          >
            {isSubmitting && <Spinner />} Yes, delete invitation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
