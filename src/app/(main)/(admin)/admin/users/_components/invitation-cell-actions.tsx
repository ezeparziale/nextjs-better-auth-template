"use client"

import { useState } from "react"
import { MoreHorizontalIcon, SendIcon, ShieldXIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteInvitationAlert from "./delete-invitation-alert"
import type { InvitationRow } from "./invitations-columns"
import ResendInvitationAlert from "./resend-invitation-alert"
import RevokeInvitationAlert from "./revoke-invitation-alert"

export default function InvitationCellActions({ row }: { row: InvitationRow }) {
  const [isResendOpen, setIsResendOpen] = useState(false)
  const [isRevokeOpen, setIsRevokeOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const isPending = row.effectiveStatus === "pending"
  const isDeletable =
    row.effectiveStatus === "revoked" || row.effectiveStatus === "expired"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <span className="sr-only">Open menu</span>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={!isPending}
            onSelect={() => setIsResendOpen(true)}
          >
            <SendIcon />
            Resend email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!isPending}
            onSelect={() => setIsRevokeOpen(true)}
          >
            <ShieldXIcon />
            Revoke
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            disabled={!isDeletable}
            onSelect={() => setIsDeleteOpen(true)}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ResendInvitationAlert
        key={`resend-${row.id}`}
        invitation={row}
        isOpen={isResendOpen}
        setIsOpen={setIsResendOpen}
      />
      <RevokeInvitationAlert
        key={`revoke-${row.id}`}
        invitation={row}
        isOpen={isRevokeOpen}
        setIsOpen={setIsRevokeOpen}
      />
      <DeleteInvitationAlert
        key={`delete-${row.id}`}
        invitation={row}
        isOpen={isDeleteOpen}
        setIsOpen={setIsDeleteOpen}
      />
    </>
  )
}
