"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

enum VerificationStatus {
  Loading = "loading",
  Success = "success",
  Error = "error",
}

const REDIRECT_DELAY = 3000

export function EmailVerification({ token }: { token: string }) {
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.Loading)
  const [seconds, setSeconds] = useState(3)
  const router = useRouter()

  useEffect(() => {
    const controller = new AbortController()

    const verify = async () => {
      if (!token) {
        setStatus(VerificationStatus.Error)
        return
      }

      try {
        const result = await authClient.verifyEmail({
          query: { token },
          fetchOptions: { signal: controller.signal },
        })

        if (result?.error) {
          throw new Error(result.error.message ?? "Error verifying email")
        }

        setStatus(VerificationStatus.Success)

        const interval = setInterval(() => {
          setSeconds((s) => (s > 0 ? s - 1 : 0))
        }, 1000)

        setTimeout(() => {
          router.push("/login?message=email-verified")
        }, REDIRECT_DELAY)

        return () => clearInterval(interval)
      } catch {
        if (controller.signal.aborted) return
        setStatus(VerificationStatus.Error)
      }
    }

    verify()
    return () => controller.abort()
  }, [token, router])

  // --- LOADING ---
  if (status === VerificationStatus.Loading) {
    return (
      <VerificationCard
        icon={<Spinner />}
        title="Verifying Email"
        description="Please wait while we verify your email…"
      />
    )
  }

  // --- SUCCESS ---
  if (status === VerificationStatus.Success) {
    return (
      <VerificationCard
        icon={<CheckCircle className="text-primary h-6 w-6" />}
        title="Email Verified"
        description={`Your email has been successfully verified. Redirecting to login in ${seconds}s…`}
      >
        <Button asChild className="w-full">
          <Link href="/login">Go to Login</Link>
        </Button>
      </VerificationCard>
    )
  }

  // --- ERROR ---
  return (
    <VerificationCard
      icon={<XCircle className="text-destructive h-6 w-6" />}
      title="Verification Error"
      description="We couldn’t verify your email"
    >
      <div className="flex gap-2">
        <Button asChild variant="outline" className="flex-1 bg-transparent">
          <Link href="/signup">Sign up</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    </VerificationCard>
  )
}

function VerificationCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <Card className="bg-card border-border mx-auto w-full max-w-md" aria-live="polite">
      <CardHeader className="text-center">
        <div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          {icon}
        </div>
        <CardTitle className="text-card-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      {children && <CardContent className="space-y-4">{children}</CardContent>}
    </Card>
  )
}
