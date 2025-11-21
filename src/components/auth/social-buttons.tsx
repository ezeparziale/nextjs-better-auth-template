"use client"

import { useState } from "react"
import { signIn } from "@/lib/auth/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GitHubIcon, GoogleIcon } from "@/components/ui/icons"
import { Spinner } from "@/components/ui/spinner"

interface SocialButtonsProps {
  callbackUrl?: string
  lastMethod?: string | null
  isLoading?: string | null
  onLoadingChange?: (method: string | null) => void
  className?: string
}

export function SocialButtons({
  callbackUrl = "/dashboard",
  lastMethod,
  isLoading: externalLoading,
  onLoadingChange,
  className,
}: SocialButtonsProps) {
  const [internalLoading, setInternalLoading] = useState<string | null>(null)

  const isLoading = externalLoading ?? internalLoading
  const setLoading = onLoadingChange ?? setInternalLoading

  const handleSocialSignIn = async (provider: "github" | "google") => {
    setLoading(provider)
    try {
      await signIn.social({ provider, callbackURL: callbackUrl })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        type="button"
        variant="outline"
        className={`relative w-full ${className}`}
        onClick={() => handleSocialSignIn("github")}
        disabled={!!isLoading}
      >
        {lastMethod === "github" && (
          <Badge className="absolute -top-2 -right-2">Last used</Badge>
        )}
        {isLoading === "github" ? (
          <Spinner />
        ) : (
          <>
            <GitHubIcon />
            GitHub
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        className={`relative w-full ${className}`}
        onClick={() => handleSocialSignIn("google")}
        disabled={!!isLoading}
      >
        {lastMethod === "google" && (
          <Badge className="absolute -top-2 -right-2">Last used</Badge>
        )}
        {isLoading === "google" ? (
          <Spinner />
        ) : (
          <>
            <GoogleIcon />
            Google
          </>
        )}
      </Button>
    </div>
  )
}
