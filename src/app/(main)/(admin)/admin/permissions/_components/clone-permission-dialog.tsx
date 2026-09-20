"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { PERMISSION_KEY_EXAMPLE } from "@/lib/auth/rbac-patterns"
import { Permission } from "@/lib/auth/rbac-plugin"
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const clonePermissionSchema = z.object({
  name: z.string().min(1, "Name is required."),
  key: z.string().min(1, "Key is required."),
  description: z.string().optional(),
  isActive: z.boolean(),
  copyRoles: z.boolean(),
})

type FormData = z.infer<typeof clonePermissionSchema>

export default function ClonePermissionDialog({
  permission,
  isOpen,
  setIsOpen,
}: {
  permission: Permission
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { refreshTable } = useDataTable()

  const form = useForm<FormData>({
    resolver: zodResolver(clonePermissionSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      isActive: true,
      copyRoles: true,
    },
    mode: "onChange",
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: `${permission.name} (Copy)`,
        key: `${permission.key}_copy`,
        description: permission.description ?? "",
        isActive: permission.isActive,
        copyRoles: true,
      })
    }
  }, [isOpen, permission, form])

  async function onSubmit(values: FormData) {
    try {
      const { data, error } = await authClient.rbac.clonePermission({
        id: permission.id,
        name: values.name,
        key: values.key,
        description: values.description || undefined,
        isActive: values.isActive,
        copyRoles: values.copyRoles,
      })

      if (error) {
        if (
          error.code === "INVALID_PERMISSION_KEY" ||
          error.code === "INVALID_PERMISSION_KEY_LENGTH" ||
          error.code === "INVALID_PERMISSION_KEY_FORMAT" ||
          error.code === "PERMISSION_ALREADY_EXISTS"
        ) {
          form.setError("key", {
            type: "custom",
            message: error.message,
          })
        }
        toast.error(error.message || "Failed to clone permission")
      } else {
        toast.success(`Permission ${data.permission.key ?? ""} cloned successfully`)
        setIsOpen(false)
        refreshTable({ resetPagination: true })
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) form.reset()
  }

  const { isSubmitting } = form.formState

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone permission</DialogTitle>
          <DialogDescription>
            Create a copy of{" "}
            <span className="text-foreground font-medium">{permission.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <form id="form-clone-permission" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <div className="flex items-end justify-between gap-x-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="w-full">
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="e.g. Create posts"
                      disabled={isSubmitting}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="isActive"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="w-auto shrink-0">
                    <FieldLabel htmlFor={field.name}>Active</FieldLabel>
                    <div className="flex h-10 items-center justify-end">
                      <Switch
                        id={field.name}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-label="Permission active status"
                        disabled={isSubmitting}
                      />
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="key"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Key</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder={`feature.action e.g. ${PERMISSION_KEY_EXAMPLE}`}
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    placeholder="e.g. A user who is allowed to create a post"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="copyRoles"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex h-10 items-center gap-2">
                    <Switch
                      id={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                    <span className="text-muted-foreground text-sm">
                      Assign to the same roles
                    </span>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="form-clone-permission" disabled={isSubmitting}>
            {isSubmitting && <Spinner />} Clone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
