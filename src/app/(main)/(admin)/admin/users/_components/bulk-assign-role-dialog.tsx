"use client"

import { useCallback, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { AsyncCombobox, type AsyncComboboxOption } from "@/components/ui/async-combobox"
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
import { Spinner } from "@/components/ui/spinner"

const bulkAssignRoleSchema = z.object({
  roleId: z.string().min(1, "Role is required."),
})

type FormData = z.infer<typeof bulkAssignRoleSchema>

type GetRolesOptionsQuery = NonNullable<
  Parameters<typeof authClient.rbac.getRolesOptions>[0]
>["query"]

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

  const form = useForm<FormData>({
    resolver: zodResolver(bulkAssignRoleSchema),
    defaultValues: {
      roleId: "",
    },
    mode: "onChange",
  })

  const fetchRoles = useCallback(
    async (search: string): Promise<AsyncComboboxOption[]> => {
      const queryParams: GetRolesOptionsQuery = {
        onlyActive: true,
        limit: 5,
      }

      if (search) {
        queryParams.search = search
      }

      const { data, error } = await authClient.rbac.getRolesOptions({
        query: queryParams,
      })

      if (error) {
        toast.error(error.message || "Failed to load roles")
        return []
      }

      return data.options.map((option) => ({
        value: option.value,
        label: option.label,
        subtitle: option.key,
      }))
    },
    [],
  )

  // Reset the selection every time the dialog opens (it stays mounted between opens)
  useEffect(() => {
    if (isOpen) {
      form.reset({ roleId: "" })
    }
  }, [isOpen, form])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
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
                <AsyncCombobox
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  fetchOptions={fetchRoles}
                  disabled={isSubmitting}
                  placeholder="Search a role..."
                  searchPlaceholder="Search roles by name or key..."
                  emptyMessage="No roles found."
                />
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
