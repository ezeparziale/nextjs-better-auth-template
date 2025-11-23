"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"

interface EmailVerifiedCardProps {
  userId: string
  emailVerified: boolean
  email: string
}

export function EmailVerifiedCard({
  userId,
  emailVerified,
  email,
}: EmailVerifiedCardProps) {
  const router = useRouter()
  const [verified, setVerified] = useState(emailVerified)
  const [isLoading, setIsLoading] = useState(false)

  const hasChanged = verified !== emailVerified

  async function handleSaveEmailVerified() {
    setIsLoading(true)
    try {
      const { error } = await authClient.admin.updateUser({
        userId,
        data: {
          emailVerified: verified,
        },
      })

      if (error) {
        toast.error(error.message || "Failed to update email verification status")
        return
      }

      toast.success("Email verification status updated successfully")
      router.refresh()
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Email Verification</CardTitle>
        <CardDescription>
          Manage the email verification status for {email}.
        </CardDescription>
        <CardAction>
          <div className="flex items-center space-x-2">
            <Label htmlFor="email-verified">
              {verified ? "Verified" : "Not Verified"}
            </Label>
            <Switch
              id="email-verified"
              checked={verified}
              onCheckedChange={setVerified}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardFooter className="bg-sidebar flex items-center justify-end rounded-b-xl border-t py-4!">
        <div className="flex w-full justify-end">
          <Button
            onClick={handleSaveEmailVerified}
            disabled={!hasChanged || isLoading}
            size="sm"
            aria-label="Save email verification status"
          >
            {isLoading && <Spinner />}
            Save
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
