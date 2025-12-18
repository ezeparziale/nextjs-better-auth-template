"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient } from "@/lib/auth/auth-client"
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

const schema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
})

type FormData = z.infer<typeof schema>

interface EmailFormProps {
  userId: string
  email: string
}

export default function EmailForm({ userId, email }: EmailFormProps) {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      email,
    },
    mode: "onChange",
  })

  const { isSubmitting, isDirty } = form.formState

  async function onSubmit(values: FormData) {
    try {
      const { error } = await authClient.admin.updateUser({
        userId,
        data: {
          email: values.email,
        },
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Email updated successfully.")
        router.refresh()
        form.reset({ ...values })
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Email</CardTitle>
        <CardDescription>Enter the user&apos;s email address.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-edit-email" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
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
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="bg-sidebar flex items-center justify-end rounded-b-xl border-t py-4!">
        <Button
          type="submit"
          form="form-edit-email"
          size="sm"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting && <Spinner />} Save
        </Button>
      </CardFooter>
    </Card>
  )
}
