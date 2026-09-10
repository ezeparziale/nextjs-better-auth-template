"use client"

import { useState } from "react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import { useDataTable } from "@/components/ui/data-table"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

interface RemoveRolesDialogProps {
  permissionId: string
  roleIds: string[]
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  onCompleted: () => void
}

export default function RemoveRolesDialog({
  permissionId,
  roleIds,
  isOpen,
  setIsOpen,
  onCompleted,
}: RemoveRolesDialogProps) {
  const { refreshTable } = useDataTable()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async () => {
    setIsSubmitting(true)
    try {
      const { data, error } = await authClient.rbac.bulkRemoveRolesFromPermission({
        permissionId,
        roleIds,
      })

      if (error) {
        toast.error(error.message || "Something went wrong")
        return
      }

      if (data.success) {
        toast.success(`${data.removedCount} role(s) removed from permission`)
        setIsOpen(false)
        onCompleted()
        refreshTable({ resetPagination: true })
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove roles from permission?</DialogTitle>
          <DialogDescription>
            This action will remove {roleIds.length} role(s) from this permission. These
            roles will no longer grant this permission to users.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onSubmit} disabled={isSubmitting} variant="destructive">
            {isSubmitting && <Spinner />} Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
