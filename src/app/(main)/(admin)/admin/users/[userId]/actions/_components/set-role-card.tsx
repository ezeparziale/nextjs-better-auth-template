"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

interface SetRoleCardProps {
  userId: string
  currentRole: string
}

export function SetRoleCard({ userId, currentRole }: SetRoleCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState(currentRole)

  async function handleSetRole() {
    startTransition(async () => {
      try {
        const { error } = await authClient.admin.setRole({
          userId,
          role: role as "admin" | "user",
        })

        if (error) {
          toast.error(error.message || "Failed to update role")
          return
        }

        toast.success("Role updated successfully")
        router.refresh()
      } catch {
        toast.error("An unexpected error occurred")
      }
    })
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>User Role</CardTitle>
        <CardDescription>Manage the user&apos;s role type.</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
      <CardFooter className="bg-sidebar flex items-center justify-between rounded-b-xl border-t py-4!">
        <p className="text-muted-foreground text-sm">
          Select the role you want to assign to this user.
        </p>
        <Button
          size="sm"
          disabled={isPending || role === currentRole}
          onClick={handleSetRole}
        >
          {isPending && <Spinner className="mr-2" />}
          Save
        </Button>
      </CardFooter>
    </Card>
  )
}
