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
  websiteUrl: z.url({ message: "Invalid URL" }).optional().or(z.literal("")),
  linkedinUrl: z.url({ message: "Invalid URL" }).optional().or(z.literal("")),
  githubUrl: z.url({ message: "Invalid URL" }).optional().or(z.literal("")),
  xUrl: z.url({ message: "Invalid URL" }).optional().or(z.literal("")),
})

type FormData = z.infer<typeof schema>

interface SocialLinksFormProps {
  userId: string
  websiteUrl?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  xUrl?: string | null
}

export default function SocialLinksForm({
  userId,
  websiteUrl,
  linkedinUrl,
  githubUrl,
  xUrl,
}: SocialLinksFormProps) {
  const router = useRouter()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      websiteUrl: websiteUrl ?? "",
      linkedinUrl: linkedinUrl ?? "",
      githubUrl: githubUrl ?? "",
      xUrl: xUrl ?? "",
    },
    mode: "onChange",
  })

  const { isSubmitting, isDirty } = form.formState

  async function onSubmit(values: FormData) {
    try {
      const { error } = await authClient.admin.updateUser({
        userId,
        data: {
          websiteUrl: values.websiteUrl,
          linkedinUrl: values.linkedinUrl,
          githubUrl: values.githubUrl,
          xUrl: values.xUrl,
        },
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Social links updated successfully.")
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
        <CardTitle>Social Links</CardTitle>
        <CardDescription>Links to your social media profiles.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-edit-social" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="websiteUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Website</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="https://example.com"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="linkedinUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>LinkedIn</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="https://linkedin.com/in/username"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="githubUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>GitHub</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="https://github.com/username"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="xUrl"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>X</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="https://x.com/username"
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
          form="form-edit-social"
          size="sm"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting && <Spinner />} Save
        </Button>
      </CardFooter>
    </Card>
  )
}
