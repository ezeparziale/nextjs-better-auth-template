"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { UserXIcon } from "lucide-react"
import { toast } from "sonner"
import { authClient, useSession } from "@/lib/auth/auth-client"
import { Button } from "./ui/button"

export default function ImpersonationUserIndicator() {
  const router = useRouter()
  const { data: session, refetch } = useSession()
  const [isPending, startTransition] = useTransition()

  if (!session?.session?.impersonatedBy) return null

  async function handleStopImpersonating() {
    startTransition(async () => {
      try {
        const { error } = await authClient.admin.stopImpersonating()

        if (error) {
          toast.error(error.message || "Something went wrong")
          return
        }

        router.push("/dashboard")
        refetch()

        toast.success("Stopped impersonating user successfully!")
      } catch {
        toast.error("Something went wrong")
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleStopImpersonating}
      aria-label="Stop impersonating user"
      title="Stop impersonating user"
      disabled={isPending}
    >
      <UserXIcon />
    </Button>
  )
}
