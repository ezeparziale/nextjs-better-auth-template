"use client"

import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient, useSession } from "@/lib/auth/auth-client"
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
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .max(32, { message: "Name must be less than 32 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, {
      message: "Name can only contain letters, spaces, hyphens, and apostrophes",
    })
    .transform((val) => val.trim()),
})

type FormData = z.infer<typeof schema>

interface NameFormProps {
  userId: string
  name: string
}

export default function NameForm({ userId, name }: NameFormProps) {
  const router = useRouter()
  const { data: session, refetch } = useSession()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      name,
    },
    mode: "onChange",
  })

  const { isSubmitting, isDirty } = form.formState

  async function onSubmit(values: FormData) {
    try {
      const { error } = await authClient.admin.updateUser({
        userId,
        data: {
          name: values.name,
        },
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Name updated successfully.")
        router.refresh()

        // If updating own profile, refresh session
        if (session?.user.id === userId) {
          await refetch()
        }

        form.reset({ ...values })
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Name</CardTitle>
        <CardDescription>
          Enter the user&apos;s fullname or display name.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-edit-name" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    aria-label="Name user"
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
          form="form-edit-name"
          size="sm"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting && <Spinner />} Save
        </Button>
      </CardFooter>
    </Card>
  )
}
