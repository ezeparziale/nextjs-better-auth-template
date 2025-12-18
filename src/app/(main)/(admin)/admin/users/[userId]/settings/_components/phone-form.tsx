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
  phone: z
    .string()
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional()
    .or(z.literal("")),
})

type FormData = z.infer<typeof schema>

interface PhoneFormProps {
  userId: string
  phone?: string | null
}

export default function PhoneForm({ userId, phone }: PhoneFormProps) {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      phone: phone ?? "",
    },
    mode: "onChange",
  })

  const { isSubmitting, isDirty } = form.formState

  async function onSubmit(values: FormData) {
    try {
      const { error } = await authClient.admin.updateUser({
        userId,
        data: {
          phone: values.phone,
        },
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Phone number updated successfully.")
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
        <CardTitle>Phone</CardTitle>
        <CardDescription>The user&apos;s phone number.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-edit-phone" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Phone</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="+1 (555) 000-0000"
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
          form="form-edit-phone"
          size="sm"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting && <Spinner />} Save
        </Button>
      </CardFooter>
    </Card>
  )
}
