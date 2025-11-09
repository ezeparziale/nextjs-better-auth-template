"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const editRoleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z.string().min(1, "Key is required"),
  description: z.string().min(1, "Description is required"),
  isActive: z.boolean(),
})

type FormData = z.infer<typeof editRoleSchema>

type Role = {
  id: string
  name: string
  key: string
  description?: string
  isActive: boolean
}

export default function EditRoleForm({ role }: { role: Role }) {
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(editRoleSchema),
    defaultValues: {
      name: role.name,
      key: role.key,
      description: role.description,
      isActive: role.isActive,
    },
  })

  async function onSubmit(values: FormData) {
    try {
      const { data, error } = await authClient.rbac.updateRole({
        id: role.id,
        name: values.name,
        key: values.key,
        description: values.description,
        isActive: values.isActive,
      })

      if (error) {
        toast.error(error.message || "Failed to update role")
      } else {
        if (data.role) {
          toast.success(`Role ${data.role?.key ?? ""} updated successfully`)
          form.reset({
            name: data.role.name,
            key: data.role.key,
            description: data.role.description,
            isActive: data.role.isActive,
          })
        }

        router.refresh()
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  const { isSubmitting, isDirty } = form.formState

  return (
    <Card>
      <CardContent>
        <form id="form-edit-user" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="w-full md:w-2/3">
            <div className="flex items-start gap-x-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
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
              <div>
                <Controller
                  name="isActive"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Active</FieldLabel>
                      <div className="flex h-10 items-center">
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
                    placeholder="feature:action e.g. posts:create"
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
            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                form="form-edit-user"
                className="w-full md:w-1/5"
                disabled={isSubmitting || !isDirty}
                size="sm"
              >
                {isSubmitting && <Spinner />} Save
              </Button>
              <Button size="sm" className="w-full md:w-1/5" variant="outline" asChild>
                <Link href="/admin/roles">Cancel</Link>
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
