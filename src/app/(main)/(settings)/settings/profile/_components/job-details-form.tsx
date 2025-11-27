"use client"

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
  jobTitle: z
    .string()
    .max(100, { message: "Job title must be less than 100 characters" })
    .optional(),
  company: z
    .string()
    .max(100, { message: "Company name must be less than 100 characters" })
    .optional(),
  department: z
    .string()
    .max(100, { message: "Department name must be less than 100 characters" })
    .optional(),
  location: z
    .string()
    .max(100, { message: "Location must be less than 100 characters" })
    .optional(),
})

type FormData = z.infer<typeof schema>

export default function JobDetailsForm({
  jobTitle,
  company,
  department,
  location,
}: {
  jobTitle: string | null | undefined
  company: string | null | undefined
  department: string | null | undefined
  location: string | null | undefined
}) {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      jobTitle: jobTitle ?? "",
      company: company ?? "",
      department: department ?? "",
      location: location ?? "",
    },
    mode: "onChange",
  })

  const { isSubmitting, isDirty } = form.formState

  async function onSubmit(values: FormData) {
    try {
      const result = await authClient.updateUser(values)

      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success("Job details updated successfully.")
        form.reset({ ...values })
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Job Details</CardTitle>
        <CardDescription>Add your professional information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-profile-job" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="jobTitle"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Job Title</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Software Engineer"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="company"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Company</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Acme Inc."
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="department"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Department</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Engineering"
                    disabled={isSubmitting}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="location"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Location</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="San Francisco, CA"
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
          form="form-profile-job"
          size="sm"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting && <Spinner />} Save
        </Button>
      </CardFooter>
    </Card>
  )
}
