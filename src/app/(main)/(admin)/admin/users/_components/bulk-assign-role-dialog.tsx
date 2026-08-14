"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"

const bulkAssignRoleSchema = z.object({
  roleId: z.string().min(1, "Role is required."),
})

type FormData = z.infer<typeof bulkAssignRoleSchema>

interface BulkAssignRoleDialogProps {
  userIds: string[]
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  onCompleted: () => void
}

export default function BulkAssignRoleDialog({
  userIds,
  isOpen,
  setIsOpen,
  onCompleted,
}: BulkAssignRoleDialogProps) {
  const { refreshTable } = useDataTable()
  const [roles, setRoles] = useState<Array<{ value: string; label: string }>>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)

  const form = useForm<FormData>({
    resolver: zodResolver(bulkAssignRoleSchema),
    defaultValues: {
      roleId: "",
    },
    mode: "onChange",
  })

  useEffect(() => {
    if (!isOpen) return
    form.reset({ roleId: "" })
    let cancelled = false
    authClient.rbac
      .getRolesOptions({
        query: {
          onlyActive: true,
          limit: 100,
        },
      })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          toast.error(error.message || "Failed to load roles")
          return
        }
        setRoles(data.options || [])
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load roles")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRoles(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, form])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      form.reset()
      setIsLoadingRoles(true)
    }
  }

  const onSubmit = async (values: FormData) => {
    try {
      const { data, error } = await authClient.rbac.bulkAssignRoleToUsers({
        roleId: values.roleId,
        userIds,
      })

      if (error) {
        toast.error(error.message || "Failed to assign role")
        return
      }

      toast.success(
        data.skippedCount > 0
          ? `Role assigned to ${data.assignedCount} user(s), ${data.skippedCount} already had it`
          : `Role assigned to ${data.assignedCount} user(s)`,
      )
      setIsOpen(false)
      onCompleted()
      refreshTable({ resetPagination: false })
    } catch {
      toast.error("Something went wrong")
    }
  }

  const { isSubmitting } = form.formState

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign role to users</DialogTitle>
          <DialogDescription>
            Assign a role to the {userIds.length} selected user(s).
          </DialogDescription>
        </DialogHeader>
        <form id="form-bulk-assign-role" onSubmit={form.handleSubmit(onSubmit)}>
          <Controller
            name="roleId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="w-full">
                <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={isSubmitting || isLoadingRoles}
                >
                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue
                      placeholder={
                        isLoadingRoles ? "Loading roles..." : "Select a role"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length === 0 && !isLoadingRoles && (
                      <div className="text-muted-foreground px-2 py-1.5 text-sm">
                        No roles available
                      </div>
                    )}
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="form-bulk-assign-role" disabled={isSubmitting}>
            {isSubmitting && <Spinner />} Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
