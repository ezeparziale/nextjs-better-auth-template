"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select"
import { Spinner } from "@/components/ui/spinner"

const addPermissionSchema = z.object({
  permissionIds: z.array(z.string()),
})

type FormData = z.infer<typeof addPermissionSchema>

interface AddPermissionDialogProps {
  roleId: string
  onPermissionAdded: (options?: { resetPagination?: boolean }) => void
}

export default function AddPermissionDialog({
  roleId,
  onPermissionAdded,
}: AddPermissionDialogProps) {
  const [open, setOpen] = useState(false)
  const [permissionsOptions, setPermissionsOptions] = useState<
    { value: string; label: string }[]
  >([])
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(addPermissionSchema),
    defaultValues: {
      permissionIds: [],
    },
  })

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
            form.reset({
              permissionIds: assignedRes.data.permissions.map((p) => p.id),
            })
          }
        } catch {
          toast.error("Failed to load data")
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    } else {
      form.reset({ permissionIds: [] })
    }
  }, [open, roleId, form])

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  const onSubmit = async (values: FormData) => {
    try {
      const { error } = await authClient.rbac.updateRole({
        id: roleId,
        permissionIds: values.permissionIds,
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
    }
  }

  const { isSubmitting, isDirty } = form.formState

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          Manage permissions
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage permissions</DialogTitle>
          <DialogDescription>
            Add or remove permissions for this role.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="py-4">
            <Controller
              name="permissionIds"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="w-full">
                  <FieldLabel>Permissions</FieldLabel>
                  <MultiSelect
                    values={field.value}
                    onValuesChange={field.onChange}
                    disabled={isLoading}
                  >
                    <MultiSelectTrigger className="w-full">
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
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isSubmitting || !isDirty}>
              {isSubmitting && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
