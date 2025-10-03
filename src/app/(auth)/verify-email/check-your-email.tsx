"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function CheckYourEmail() {
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  return (
    <Card className="bg-card border-border mx-auto w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-card-foreground">Check your email</CardTitle>
        <CardDescription className="text-muted-foreground">
          We&apos;ve sent a verification link to{" "}
          <span className="text-primary font-semibold">{email ?? "your email"}</span>.
          Please check your inbox and click the link to complete the process.
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
