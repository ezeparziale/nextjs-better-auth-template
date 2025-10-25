"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { updatePasswordFormSchema, type UpdatePasswordForm } from "@/schemas/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type FormData = UpdatePasswordForm

export function UpdatePasswordForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(updatePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onChange",
  })

  const { isDirty, isSubmitting } = form.formState

  useEffect(() => {
    if (!isDirty) {
      form.clearErrors()
    }
  }, [isDirty, form])

  async function onSubmit(values: FormData) {
    try {
      const res = await authClient.changePassword({
        ...values,
        revokeOtherSessions: true,
      })
      if (res.error) {
        toast.error(res.error.message)
        return
      }
      toast.success("Password updated successfully")
      form.reset()
    } catch {
      toast.error("Error updating password")
    }
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Update password</CardTitle>
        <CardDescription>
          Update your current password and set a new password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-update-password" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="currentPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Current password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="password"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="newPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="password"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="confirmPassword"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    type="password"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="bg-sidebar flex items-center justify-between gap-4 rounded-b-xl border-t py-4!">
        <CardDescription>
          For your security, this will sign you out of all other devices.
        </CardDescription>
        <Button
          type="submit"
          form="form-update-password"
          disabled={isSubmitting || !isDirty}
          size="sm"
        >
          {isSubmitting && <Spinner />} Update
        </Button>
      </CardFooter>
    </Card>
  )
}
