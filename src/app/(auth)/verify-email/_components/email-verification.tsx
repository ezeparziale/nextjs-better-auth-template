"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CheckCircle, XCircle } from "lucide-react"
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
        title="Verifying email"
        description="Please wait while we verify your email…"
      />
    )
  }

  // --- SUCCESS ---
  if (status === VerificationStatus.Success) {
    return (
      <VerificationCard
        icon={<CheckCircle className="text-primary size-6" />}
        title="Email verified"
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
      icon={<XCircle className="text-destructive size-6" />}
      title="Verification error"
      description="We couldn't verify your email"
    >
      <div className="flex gap-2">
        <Button asChild variant="outline" className="flex-1">
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
    <Card>
      <CardHeader className="text-center">
        <div className="bg-muted mx-auto mb-4 flex size-12 items-center justify-center rounded-full">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  )
}
