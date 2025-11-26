"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Passkey } from "@better-auth/passkey"
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
import { buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

interface DeletePasskeyAlertProps {
  passkey: Passkey | null
  onOpenChange: (open: boolean) => void
}

export function DeletePasskeyAlert({ passkey, onOpenChange }: DeletePasskeyAlertProps) {
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const router = useRouter()

  async function handleDeletePasskey() {
    if (!passkey) return

    setIsDeleting(true)

    try {
      const { error } = await authClient.passkey.deletePasskey({ id: passkey.id })

      if (error) {
        toast.error(error.message || "Failed to delete passkey")
        return
      }
      toast.success("Passkey deleted successfully")
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error("Failed to delete passkey")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={!!passkey} onOpenChange={(open) => !open && onOpenChange(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete passkey?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete{" "}
            <span className="text-foreground font-semibold">
              &quot;{passkey?.name}&quot;
            </span>
            . You&apos;ll need to create a new passkey to use passwordless
            authentication on this device again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={handleDeletePasskey}
            disabled={isDeleting}
          >
            {isDeleting && <Spinner />} Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
