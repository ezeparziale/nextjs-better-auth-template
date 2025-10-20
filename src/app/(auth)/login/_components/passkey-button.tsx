"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { KeyIcon } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export default function PasskeyButton() {
  const router = useRouter()

  const { refetch } = authClient.useSession()

  useEffect(() => {
    authClient.signIn.passkey(
      { autoFill: true },
      {
        onSuccess() {
          refetch()
          router.push("/dashboard")
        },
      },
    )
  }, [router, refetch])

  async function handlePasskeyLogin() {
    try {
      const result = await authClient.signIn.passkey(undefined)
      if (result.error) {
        console.error(result.error)
        toast.error(result.error.message || "Something went wrong")
        return
      }
      refetch()
      router.push("/dashboard")
    } catch {
      toast.error("Something went wrong")
    }
  }
  return (
    <Button className="w-full" variant="outline" onClick={() => handlePasskeyLogin()}>
      <KeyIcon />
      Use passkey
    </Button>
  )
}
