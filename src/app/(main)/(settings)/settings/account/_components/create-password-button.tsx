"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export function CreatePasswordForm({ email }: { email: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleCreatePasswordReset() {
    setIsLoading(true)
    try {
      const res = await authClient.requestPasswordReset({
        email,
        redirectTo: "/auth/reset-password",
      })
      if (res.error) throw new Error("Error")
      toast.success("Email sent successfully")
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
        <CardTitle>Create Password</CardTitle>
        <CardDescription>
          Click the button to receive an email and create your password.
        </CardDescription>
      </CardHeader>
      <CardFooter className="bg-sidebar flex items-center justify-end rounded-b-xl border-t py-4!">
        <Button
          type="button"
          onClick={() => handleCreatePasswordReset()}
          disabled={isLoading}
          size="sm"
        >
          {isLoading && <Spinner />}
          Request password reset
        </Button>
      </CardFooter>
    </Card>
  )
}
