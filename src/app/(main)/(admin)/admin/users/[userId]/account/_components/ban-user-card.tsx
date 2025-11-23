"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import BanUnbanUserDialog from "../../../_components/ban-user-dialog"

interface BanUserCardProps {
  userId: string
  isBanned: boolean
  email: string
  banReason?: string | null
  banExpires?: Date | null
}

export function BanUserCard({
  userId,
  isBanned,
  email,
  banReason,
  banExpires,
}: BanUserCardProps) {
  const router = useRouter()
  const [banned, setBanned] = useState(isBanned)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const hasChanged = banned !== isBanned

  useEffect(() => {
    if (isDialogOpen === false) {
      router.refresh()
    }
  }, [isDialogOpen, router])

  return (
    <>
      <Card className="pb-0">
        <CardHeader>
          <CardTitle>Ban User</CardTitle>
          <CardDescription>
            Manage the ban status for {email}. Banning a user will prevent them from
            logging in.
          </CardDescription>
          <CardAction>
            <div className="flex items-center space-x-2">
              <Label htmlFor="ban-user">{banned ? "Banned" : "Active"}</Label>
              <Switch id="ban-user" checked={banned} onCheckedChange={setBanned} />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          {isBanned && (
            <div className="text-muted-foreground space-y-1 text-sm">
              <p>
                <span className="text-foreground font-medium">Reason:</span>{" "}
                {banReason || "No reason provided"}
              </p>
              <p>
                <span className="text-foreground font-medium">Expires:</span>{" "}
                {banExpires ? new Date(banExpires).toLocaleString() : "Never"}
              </p>
            </div>
          )}
          {!isBanned && (
            <p className="text-muted-foreground text-sm">
              The user is currently active and has full access.
            </p>
          )}
        </CardContent>
        <CardFooter className="bg-sidebar flex items-center justify-end rounded-b-xl border-t py-4!">
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={!hasChanged}
            size="sm"
            arial-label="Save ban status"
          >
            Save
          </Button>
        </CardFooter>
      </Card>
      <BanUnbanUserDialog
        userId={userId}
        userEmail={email}
        isBanned={isBanned}
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
      />
    </>
  )
}
