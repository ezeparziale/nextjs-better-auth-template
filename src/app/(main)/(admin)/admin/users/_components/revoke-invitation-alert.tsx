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

export default function RevokeInvitationAlert({
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

  const handleRevoke = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await authClient.invitation.revoke({
        invitationId: invitation.id,
      })

      if (error) {
        toast.error(error.message || "Failed to revoke invitation")
        return
      }

      toast.success(`Invitation revoked for ${invitation.email}`)
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
          <AlertDialogTitle>Revoke this invitation?</AlertDialogTitle>
          <AlertDialogDescription>
            The invitation for <span className="font-medium">{invitation.email}</span>{" "}
            will no longer be valid and the invited user won&apos;t be able to accept
            it. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={isSubmitting}
            variant="destructive"
          >
            {isSubmitting && <Spinner />} Yes, revoke invitation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
