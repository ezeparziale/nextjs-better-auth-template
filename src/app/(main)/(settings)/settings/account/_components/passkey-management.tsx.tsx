"use client"

import { useState } from "react"
import { Passkey } from "@better-auth/passkey"
import { PlusIcon, ShieldCheckIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CreatePasskeyDialog } from "./create-passkey-dialog"
import { DeletePasskeyAlert } from "./delete-passkey-alert"
import { EditPasskeyDialog } from "./edit-passkey-dialog"
import { NoPasskeysEmptyState } from "./no-passkeys-empty-state"
import { PasskeyCard } from "./passkey-card"
import { PasswordRequiredEmptyState } from "./password-required-empty-state"

export default function PasskeyManagement({
  passKeys,
  hasPasswordAccount,
}: {
  passKeys: Passkey[]
  hasPasswordAccount: boolean
}) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [deletePasskey, setDeletePasskey] = useState<Passkey | null>(null)
  const [editPasskey, setEditPasskey] = useState<Passkey | null>(null)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                Passkey management
              </CardTitle>
              <CardDescription>
                Manage your passkeys for secure, passwordless authentication across all
                your devices.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => setIsDialogOpen(true)}
              aria-label="Add passkey"
              className="shrink-0"
              disabled={!hasPasswordAccount}
            >
              <PlusIcon />
              <span className="hidden sm:inline">Create new passkey</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!hasPasswordAccount ? (
            <PasswordRequiredEmptyState />
          ) : passKeys.length === 0 ? (
            <NoPasskeysEmptyState onAdd={() => setIsDialogOpen(true)} />
          ) : (
            <div className="space-y-3">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  {passKeys.length} {passKeys.length === 1 ? "passkey" : "passkeys"}{" "}
                  configured
                </p>
                <Badge variant="secondary" className="gap-1.5">
                  <ShieldCheckIcon className="size-3" />
                  Secure
                </Badge>
              </div>
              {passKeys.map((passkey) => (
                <PasskeyCard
                  key={passkey.id}
                  passkey={passkey}
                  onEdit={setEditPasskey}
                  onDelete={setDeletePasskey}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <CreatePasskeyDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <DeletePasskeyAlert
        passkey={deletePasskey}
        onOpenChange={(open) => !open && setDeletePasskey(null)}
      />
      {editPasskey && (
        <EditPasskeyDialog
          open={!!editPasskey}
          onOpenChange={(open) => !open && setEditPasskey(null)}
          passkey={editPasskey}
        />
      )}
    </>
  )
}
