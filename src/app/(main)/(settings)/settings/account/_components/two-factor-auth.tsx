"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import DisableTwoFactorModal from "./disable-two-factor-modal"
import EnableTwoFactorModal from "./enable-two-factor-modal"

export default function TwoFactorAuth({
  isEnabled,
  hasPasswordAccount,
}: {
  isEnabled: boolean
  hasPasswordAccount: boolean
}) {
  const [isEnableModalOpen, setIsEnableModalOpen] = useState<boolean>(false)
  const [isDisableModalOpen, setIsDisableModalOpen] = useState<boolean>(false)

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardAction>
          {isEnabled ? (
            <Badge variant="green-subtle">Enabled</Badge>
          ) : (
            <Badge variant="red-subtle">Disabled</Badge>
          )}
        </CardAction>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardFooter
        className={cn(
          "bg-sidebar flex items-center justify-between gap-4 rounded-b-xl border-t py-4!",
          hasPasswordAccount && "justify-end",
        )}
      >
        {!hasPasswordAccount && (
          <CardDescription>
            Create a password first to enable two factor.
          </CardDescription>
        )}
        {isEnabled ? (
          <Button
            variant="destructive"
            onClick={() => setIsDisableModalOpen(true)}
            size="sm"
          >
            Disable 2FA
          </Button>
        ) : (
          <Button
            onClick={() => setIsEnableModalOpen(true)}
            disabled={!hasPasswordAccount}
            size="sm"
          >
            Enable 2FA
          </Button>
        )}
      </CardFooter>
      <EnableTwoFactorModal
        open={isEnableModalOpen}
        onOpenChange={setIsEnableModalOpen}
      />
      <DisableTwoFactorModal
        open={isDisableModalOpen}
        onOpenChange={setIsDisableModalOpen}
      />
    </Card>
  )
}
