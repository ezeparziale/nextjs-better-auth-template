"use client"

import { useEffect } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
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

export default function NameForm() {
  const { data: session, isPending, refetch } = useSession()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      name: session?.user.name ?? "",
    },
    mode: "onChange",
  })

  useEffect(() => {
    if (session?.user.name && !isPending) {
      form.reset({ name: session.user.name })
    }
  }, [session?.user.name, isPending, form])

  const { isSubmitting, isDirty } = form.formState

  async function onSubmit(values: FormData) {
    try {
      const result = await authClient.updateUser(values)

      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success("Name updated successfully.")
        refetch()
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Name</CardTitle>
        <CardDescription>Enter your fullname or a display name.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-profile-name" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                  {isPending ? (
                    <Skeleton className="h-9 w-full" />
                  ) : (
                    <>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        aria-label="Name user"
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </>
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="bg-sidebar flex items-center justify-end rounded-b-xl border-t py-4!">
        <Button
          type="submit"
          form="form-profile-name"
          size="sm"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting && <Spinner />} Save
        </Button>
      </CardFooter>
    </Card>
  )
}
