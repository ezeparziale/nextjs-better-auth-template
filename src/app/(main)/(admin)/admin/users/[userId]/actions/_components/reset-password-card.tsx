"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

export function ResetPasswordCard({
  userId,
  hasCredentialAccount,
}: {
  userId: string
  hasCredentialAccount: boolean
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleReset = async () => {
    setIsLoading(true)
    try {
      const { error } = await authClient.adminPlus.removePassword({
        userId,
      })

      if (error) {
        toast.error("Error resetting password")
        return
      }

      router.refresh()
      toast.success("Password reset successfully")
      setIsOpen(false)
    } catch {
      toast.error("Error resetting password")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Reset user password</CardTitle>
        <CardDescription>Reset the user&apos;s password to blank</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            {hasCredentialAccount ? (
              <>
                <DialogHeader>
                  <DialogTitle>Confirm password reset</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to reset this user&apos;s password?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-y-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReset}
                    disabled={isLoading}
                    variant="destructive"
                  >
                    {isLoading && <Spinner />}
                    Reset password
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Cannot reset password</DialogTitle>
                  <DialogDescription>
                    This user does not have a password set. There&apos;s nothing to
                    reset.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button onClick={() => setIsOpen(false)}>Close</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="bg-sidebar flex items-center justify-end rounded-b-xl border-t py-4!">
        <Button
          onClick={() => setIsOpen(true)}
          disabled={isLoading}
          size="sm"
          aria-label="Reset password"
        >
          {isLoading && <Spinner />}
          Reset password
        </Button>
      </CardFooter>
    </Card>
  )
}
