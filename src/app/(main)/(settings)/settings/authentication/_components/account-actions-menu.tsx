"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ExternalLinkIcon, MoreHorizontalIcon } from "lucide-react"
import { toast } from "sonner"
import { SupportedOAuthProvider } from "@/lib/auth/auth"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"

export default function AccountActionsMenu({
  providerId,
  accountId,
}: {
  providerId: SupportedOAuthProvider
  accountId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleDisconnectAccount() {
    startTransition(async () => {
      try {
        const response = await authClient.unlinkAccount({
          providerId,
          accountId,
        })

        if (response.error) {
          toast.error(response.error.message || "Something went wrong")
          return
        }

        toast.success("Account unlinked successfully")
        router.refresh()
      } catch {
        toast.error("Something went wrong")
      }
    })
  }

  const providerUrl =
    providerId === "google"
      ? "https://myaccount.google.com/connections"
      : providerId === "github"
        ? "https://github.com/settings/applications"
        : "#"

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Manage ${providerId} account`}
          size="icon-sm"
          disabled={isPending}
        >
          {isPending ? <Spinner /> : <MoreHorizontalIcon />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-50" align="end">
        <DropdownMenuItem asChild aria-label="Manage account">
          <Link href={providerId === "credential" ? "/settings/account" : providerUrl}>
            {providerId === "credential" ? (
              "Manage"
            ) : (
              <>
                Manage on provider <ExternalLinkIcon className="ml-auto" />
              </>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={handleDisconnectAccount}
          variant="destructive"
          aria-label="Disconnect account"
          disabled={isPending}
        >
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
