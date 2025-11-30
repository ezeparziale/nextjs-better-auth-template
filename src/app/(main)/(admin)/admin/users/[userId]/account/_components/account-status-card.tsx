"use client"

import { useState } from "react"
import {
  BanIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  InfoIcon,
  MailIcon,
  MoreHorizontalIcon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import BanUnbanUserDialog from "../../../_components/ban-user-dialog"

export default function AccountStatusCard({
  data,
}: {
  data: {
    userId: string
    email: string
    emailVerified: boolean
    banned: boolean | null | undefined
    banReason: string | null | undefined
    banExpires: Date | null | undefined
  }
}) {
  const [bannedData, setBannedData] = useState<{
    banned: boolean | null | undefined
    banReason: string | null | undefined
    banExpires: Date | null | undefined
  }>({
    banned: data.banned,
    banReason: data.banReason,
    banExpires: data.banExpires,
  })

  const [emailVerified, setEmailVerified] = useState(data.emailVerified)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  async function handleSaveEmailVerified() {
    try {
      const { error } = await authClient.admin.updateUser({
        userId: data.userId,
        data: {
          emailVerified: !emailVerified,
        },
      })

      if (error) {
        toast.error(error.message || "Failed to update email verification status")
        return
      }

      setEmailVerified(!emailVerified)
      toast.success("Email verification status updated successfully")
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Account Status</CardTitle>
            <CardDescription>Manage the user account status.</CardDescription>
          </div>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" aria-label="Open menu" size="icon">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleSaveEmailVerified}>
                    {emailVerified ? (
                      <>
                        <XIcon />
                        Set not verified
                      </>
                    ) : (
                      <>
                        <CheckIcon />
                        Set verified
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsDialogOpen(true)
                    }}
                  >
                    {bannedData.banned ? (
                      <>
                        <CheckCircleIcon />
                        Unban
                      </>
                    ) : (
                      <>
                        <BanIcon />
                        Ban
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium uppercase">
              Email Address
            </span>

            <div className="flex items-center gap-2">
              <MailIcon className="text-muted-foreground size-4" />
              <span className="font-medium">{data.email}</span>
              <Badge variant="green-subtle">Primary</Badge>
              {emailVerified ? (
                <Badge variant="blue-subtle">
                  <CheckCircleIcon />
                  Verified
                </Badge>
              ) : (
                <Badge variant="yellow-subtle">
                  <ClockIcon />
                  Pending verification
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs font-medium uppercase">
              Account Status
            </span>
            <div className="flex items-center gap-2">
              <Badge variant={bannedData.banned ? "red-subtle" : "green-subtle"}>
                {bannedData.banned ? <BanIcon /> : <CheckCircleIcon />}
                {bannedData.banned ? "Banned" : "Active"}
              </Badge>
            </div>
          </div>
        </div>

        {bannedData.banned && (
          <div className="bg-destructive/5 text-destructive grid gap-4 rounded-md border border-red-200 p-4 dark:border-red-900/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Account Suspended</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium uppercase">
                  Reason
                </span>
                <div className="flex items-center gap-2">
                  <InfoIcon />
                  <span className="text-sm font-medium">
                    {bannedData.banReason || "No reason provided"}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground text-xs font-medium uppercase">
                  Expires
                </span>
                <div className="flex items-center gap-2">
                  <CalendarIcon />
                  <span className="text-sm font-medium">
                    {bannedData.banExpires
                      ? new Date(bannedData.banExpires).toLocaleString()
                      : "Never"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <BanUnbanUserDialog
        userId={data.userId}
        userEmail={data.email}
        isBanned={!!bannedData.banned}
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        setBannedData={setBannedData}
      />
    </Card>
  )
}
