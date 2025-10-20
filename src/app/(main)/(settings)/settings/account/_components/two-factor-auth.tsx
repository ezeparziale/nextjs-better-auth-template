"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center justify-between gap-2">
            <span> Two-Factor Authentication</span>
            {isEnabled ? (
              <Badge variant="green-subtle">Enabled</Badge>
            ) : (
              <Badge variant="red-subtle">Disabled</Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Add an extra layer of security to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEnabled ? (
          <Button variant="destructive" onClick={() => setIsDisableModalOpen(true)}>
            Disable 2FA
          </Button>
        ) : (
          <Button
            onClick={() => setIsEnableModalOpen(true)}
            disabled={!hasPasswordAccount}
          >
            Enable 2FA
          </Button>
        )}
      </CardContent>
      {!hasPasswordAccount && (
        <CardFooter>Create a password first to enable two factor.</CardFooter>
      )}
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
