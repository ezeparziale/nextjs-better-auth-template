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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

const schema = z.object({
  bio: z
    .string()
    .max(500, { message: "Bio must be less than 500 characters" })
    .optional()
    .or(z.literal("")),
})

type FormData = z.infer<typeof schema>

interface BioFormProps {
  userId: string
  bio?: string | null
}

export default function BioForm({ userId, bio }: BioFormProps) {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      bio: bio ?? "",
    },
    mode: "onChange",
  })

  const { isSubmitting, isDirty } = form.formState

  async function onSubmit(values: FormData) {
    try {
      const { error } = await authClient.admin.updateUser({
        userId,
        data: {
          bio: values.bio,
        },
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Bio updated successfully.")
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
        <CardTitle>Bio</CardTitle>
        <CardDescription>A brief description about the user.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-edit-bio" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="bio"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    placeholder="Tell us a little bit about this user"
                    className="resize-none"
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
          form="form-edit-bio"
          size="sm"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting && <Spinner />} Save
        </Button>
      </CardFooter>
    </Card>
  )
}
