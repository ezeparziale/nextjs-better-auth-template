"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { authClient, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function ImpersonateUserCard({ userId }: { userId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { refetch } = useSession()

  async function handleImpersonateUser() {
    startTransition(async () => {
      try {
        const { data, error } = await authClient.admin.impersonateUser({
          userId,
        })

        if (error) {
          toast.error(error.message || "Something went wrong")
          return
        }

        if (data) {
          toast.success("User impersonated successfully!")
          router.push("/dashboard")
          refetch()
        }
      } catch {
        toast.error("An unexpected error occurred")
      }
    })
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Impersonate User</CardTitle>
        <CardDescription>
          Log in as this user to view the application from their perspective. This can
          be useful for debugging issues or providing support.
        </CardDescription>
      </CardHeader>
      <CardFooter className="bg-sidebar flex items-center justify-end rounded-b-xl border-t py-4!">
        <Button
          size="sm"
          disabled={isPending}
          onClick={handleImpersonateUser}
          aria-label="Impersonate user"
        >
          {isPending && <Spinner />} Impersonate user
        </Button>
      </CardFooter>
    </Card>
  )
}
