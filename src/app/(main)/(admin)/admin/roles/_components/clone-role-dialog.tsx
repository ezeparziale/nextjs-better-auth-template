import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
import { Role } from "@/lib/auth/rbac-plugin"
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

const cloneRoleSchema = z.object({
  name: z.string().min(1, "Name is required."),
  key: z.string().min(1, "Key is required."),
  description: z.string().optional(),
  isActive: z.boolean(),
  copyPermissions: z.boolean(),
  copyUsers: z.boolean(),
})

type FormData = z.infer<typeof cloneRoleSchema>

export default function CloneRoleDialog({
  role,
  isOpen,
  setIsOpen,
}: {
  role: Role
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { refreshTable } = useDataTable()

  const form = useForm<FormData>({
    resolver: zodResolver(cloneRoleSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      isActive: true,
      copyPermissions: true,
      copyUsers: true,
    },
    mode: "onChange",
  })

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: `${role.name} (Copy)`,
        key: `${role.key}_copy`,
        description: role.description ?? "",
        isActive: role.isActive,
        copyPermissions: true,
        copyUsers: true,
      })
    }
  }, [isOpen, role, form])

  async function onSubmit(values: FormData) {
    try {
      const { data, error } = await authClient.rbac.cloneRole({
        id: role.id,
        name: values.name,
        key: values.key,
        description: values.description || undefined,
        isActive: values.isActive,
        copyPermissions: values.copyPermissions,
        copyUsers: values.copyUsers,
      })

      if (error) {
        if (
          error.code === "INVALID_ROLE_KEY" ||
          error.code === "INVALID_ROLE_KEY_LENGTH" ||
          error.code === "INVALID_ROLE_KEY_FORMAT" ||
          error.code === "ROLE_ALREADY_EXISTS"
        ) {
          form.setError("key", {
            type: "custom",
            message: error.message,
          })
        }
        toast.error(error.message || "Failed to clone role")
      } else {
        toast.success(`Role ${data.role.key ?? ""} cloned successfully`)
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
          <DialogTitle>Clone role</DialogTitle>
          <DialogDescription>
            Create a copy of{" "}
            <span className="text-foreground font-medium">{role.name}</span>. Choose
            whether to also copy its permissions.
          </DialogDescription>
        </DialogHeader>
        <form id="form-clone-role" onSubmit={form.handleSubmit(onSubmit)}>
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
                        aria-label="Role active status"
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
                    placeholder="e.g. create_posts"
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
                    placeholder="e.g. A user who is allowed to create and edit posts"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="copyPermissions"
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
                      Copy permissions from this role
                    </span>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="copyUsers"
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
                      Copy users assigned to this role
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
          <Button type="submit" form="form-clone-role" disabled={isSubmitting}>
            {isSubmitting && <Spinner />} Clone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
