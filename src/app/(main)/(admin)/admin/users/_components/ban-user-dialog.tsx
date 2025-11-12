"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { emitUsersRefresh } from "./events"

interface BanUnbanUserDialogProps {
  userId: string
  userEmail: string
  isBanned: boolean
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

type BanDurationOption =
  | "1_hour"
  | "1_day"
  | "1_week"
  | "1_month"
  | "1_year"
  | "forever"

const DURATION_SECONDS: Record<Exclude<BanDurationOption, "forever">, number> = {
  "1_hour": 3600,
  "1_day": 86400,
  "1_week": 604800,
  "1_month": 2592000,
  "1_year": 31536000,
}

export default function BanUnbanUserDialog({
  userId,
  userEmail,
  isBanned,
  isOpen,
  setIsOpen,
}: BanUnbanUserDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [reason, setReason] = useState("")
  const [banExpiresIn, setBanExpiresIn] = useState<BanDurationOption>("forever")

  async function handleAction() {
    startTransition(async () => {
      try {
        let response:
          | Awaited<ReturnType<typeof authClient.admin.banUser>>
          | Awaited<ReturnType<typeof authClient.admin.unbanUser>>

        if (isBanned) {
          response = await authClient.admin.unbanUser({ userId })
        } else {
          response = await authClient.admin.banUser({
            userId,
            banReason: reason.trim() || undefined,
            banExpiresIn:
              banExpiresIn === "forever" ? undefined : DURATION_SECONDS[banExpiresIn],
          })
        }

        if (response.error) {
          toast.error(response.error.message || "Something went wrong")
          return
        }

        if (response.data) {
          toast.success(
            `User ${userEmail} ${isBanned ? "unbanned" : "banned"} successfully!`,
          )
          setIsOpen(false)
          emitUsersRefresh({ resetPagination: false })
        }
      } catch {
        toast.error("Something went wrong")
      }
    })
  }

  const title = isBanned ? "Unban user?" : "Ban user?"
  const description = isBanned
    ? `Are you sure you want to unban ${userEmail}? This will restore their access.`
    : `Are you sure you want to ban ${userEmail}? This will restrict their access.`

  const buttonLabel = isBanned ? "Unban user" : "Ban user"

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {!isBanned && (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reason">Reason (optional)</FieldLabel>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Violation of terms"
              />
            </Field>
            <Field>
              <FieldLabel>Ban duration</FieldLabel>
              <Select
                value={banExpiresIn}
                onValueChange={(v: BanDurationOption) => setBanExpiresIn(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1_hour">1 hour</SelectItem>
                  <SelectItem value="1_day">1 day</SelectItem>
                  <SelectItem value="1_week">1 week</SelectItem>
                  <SelectItem value="1_month">1 month</SelectItem>
                  <SelectItem value="1_year">1 year</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant={isBanned ? "default" : "destructive"}
            disabled={isPending}
            onClick={handleAction}
          >
            {isPending && <Spinner />} {buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
