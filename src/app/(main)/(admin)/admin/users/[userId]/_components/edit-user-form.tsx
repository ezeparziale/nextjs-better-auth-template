"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient, useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address").min(1, "Email is required"),
})

type FormData = z.infer<typeof editUserSchema>

type User = {
  id: string
  name: string
  email: string
}

export default function EditUserForm({ user }: { user: User }) {
  const router = useRouter()
  const { refetch } = useSession()

  const form = useForm<FormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
    },
  })

  async function onSubmit(values: FormData) {
    try {
      const { data, error } = await authClient.admin.updateUser({
        userId: user.id,
        data: {
          email: values.email,
          name: values.name,
        },
      })

      if (error) {
        toast.error(error.message || "Failed to update user")
      } else {
        toast.success(`User ${data.email ?? ""} updated successfully`)

        form.reset({
          name: data.name,
          email: data.email,
        })

        router.refresh()
        refetch()
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
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="James Smith"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="user@example.com"
                    type="email"
                    autoComplete="email"
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
                <Link href="/admin/users/">Cancel</Link>
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
