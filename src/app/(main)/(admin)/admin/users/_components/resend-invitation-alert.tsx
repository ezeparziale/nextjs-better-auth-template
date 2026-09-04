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

export default function ResendInvitationAlert({
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

  const handleResend = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await authClient.invitation.resend({
        invitationId: invitation.id,
      })

      if (error) {
        toast.error(error.message || "Failed to resend invitation")
        return
      }

      toast.success(`Invitation email sent to ${invitation.email}`)
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
          <AlertDialogTitle>Resend invitation email?</AlertDialogTitle>
          <AlertDialogDescription>
            A new invitation email will be sent to{" "}
            <span className="font-medium">{invitation.email}</span> using the same
            invitation link.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleResend} disabled={isSubmitting}>
            {isSubmitting && <Spinner />} Yes, resend email
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
