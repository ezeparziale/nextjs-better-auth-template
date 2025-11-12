"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import type { SupportedOAuthProvider } from "@/lib/auth/auth"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function ProviderLinkButton({ provider }: { provider: SupportedOAuthProvider }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function handleLinkAccount() {
    startTransition(async () => {
      if (!provider) return

      const [result] = await Promise.all([
        authClient.linkSocial({
          provider,
          callbackURL: window.location.href,
          scopes: ["https://www.googleapis.com/auth/drive.readonly"],
        }),
        new Promise((resolve) => setTimeout(resolve, 400)),
      ])

      if (result.error) {
        toast.error(result.error.message || "Something went wrong")
        return
      }

      toast.success("Account linked successfully")
      router.refresh()
    })
  }

  if (provider === "credential") {
    return (
      <Button variant="default" aria-label="Manage account" size="sm" asChild>
        <Link href={"/settings/account"}>Manage</Link>
      </Button>
    )
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleLinkAccount}
      disabled={isPending}
      aria-label={`Link ${provider} account`}
    >
      {isPending && <Spinner />}
      Link
    </Button>
  )
}
