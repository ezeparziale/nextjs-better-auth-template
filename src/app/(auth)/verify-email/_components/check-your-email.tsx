"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

const COOLDOWN_SECONDS = 30

export function CheckYourEmail({ email }: { email: string }) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [resendCooldown, setResendCooldown] = useState<number>(0)
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    } else {
      setIsResendDisabled(false)
    }

    return () => clearInterval(timer)
  }, [resendCooldown])

  async function handleSendVerificationEmail() {
    setIsLoading(true)
    try {
      await authClient.sendVerificationEmail({ email })
      toast.success("Verification link resent successfully")
      setResendCooldown(COOLDOWN_SECONDS)
      setIsResendDisabled(true)
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to{" "}
          <span className="text-primary font-semibold">{email}</span>. Please check your
          inbox and click the link to complete the process.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            onClick={handleSendVerificationEmail}
            disabled={isLoading || isResendDisabled}
          >
            {isLoading ? (
              <Spinner />
            ) : isResendDisabled ? (
              `Resend in ${resendCooldown}s`
            ) : (
              "Resend verification link"
            )}
          </Button>
          <Button type="button" className="w-full" variant="ghost">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
