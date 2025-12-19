"use client"

import { useEffect, useState } from "react"
import { PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select"

interface AddPermissionDialogProps {
  roleId: string
  onPermissionAdded: (options?: { resetPagination?: boolean }) => void
}

export default function AddPermissionDialog({
  roleId,
  onPermissionAdded,
}: AddPermissionDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [permissionsOptions, setPermissionsOptions] = useState<
    { value: string; label: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setIsLoading(true)
        try {
          const [optionsRes, assignedRes] = await Promise.all([
            authClient.rbac.getPermissionsOptions({ query: {} }),
            authClient.rbac.getRolePermissions({
              query: { roleId, limit: 10000 },
            }),
          ])

          if (optionsRes.data) {
            setPermissionsOptions(optionsRes.data.options || [])
          }

          if (assignedRes.data?.permissions) {
            setSelectedPermissionIds(assignedRes.data.permissions.map((p) => p.id))
          }
        } catch {
          toast.error("Failed to load data")
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    }
  }, [open, roleId])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSelectedPermissionIds([])
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const { error } = await authClient.rbac.updateRole({
        id: roleId,
        permissionIds: selectedPermissionIds,
      })

      if (error) {
        toast.error(error.message || "Failed to update permissions")
      } else {
        toast.success("Permissions updated successfully")
        handleOpenChange(false)
        onPermissionAdded({ resetPagination: true })
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          Manage Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Permissions</DialogTitle>
          <DialogDescription>
            Add or remove permissions for this role.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <MultiSelect
            values={selectedPermissionIds}
            onValuesChange={setSelectedPermissionIds}
            disabled={isLoading}
          >
            <MultiSelectTrigger>
              <MultiSelectValue
                placeholder={isLoading ? "Loading..." : "Select permissions"}
              />
            </MultiSelectTrigger>
            <MultiSelectContent>
              {permissionsOptions.map((option) => (
                <MultiSelectItem key={option.value} value={option.value}>
                  {option.label}
                </MultiSelectItem>
              ))}
            </MultiSelectContent>
          </MultiSelect>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isSubmitting}>
            {isSubmitting ? "Saving..." : `Save (${selectedPermissionIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
