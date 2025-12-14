"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { authClient, useSession } from "@/lib/auth/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

const editUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address").min(1, "Email is required"),
  bio: z
    .string()
    .max(500, { message: "Bio must be less than 500 characters" })
    .optional(),
  phone: z
    .string()
    .max(20, { message: "Phone number must be less than 20 characters" })
    .optional(),
  websiteUrl: z.url({ message: "Invalid URL" }).optional().or(z.literal("")),
  linkedinUrl: z.url({ message: "Invalid URL" }).optional().or(z.literal("")),
  githubUrl: z.url({ message: "Invalid URL" }).optional().or(z.literal("")),
  xUrl: z.url({ message: "Invalid URL" }).optional().or(z.literal("")),
  jobTitle: z
    .string()
    .max(100, { message: "Job title must be less than 100 characters" })
    .optional(),
  company: z
    .string()
    .max(100, { message: "Company must be less than 100 characters" })
    .optional(),
  department: z
    .string()
    .max(100, { message: "Department must be less than 100 characters" })
    .optional(),
  location: z
    .string()
    .max(100, { message: "Location must be less than 100 characters" })
    .optional(),
})

type FormData = z.infer<typeof editUserSchema>

type User = {
  id: string
  name: string
  email: string
  bio?: string | null
  phone?: string | null
  websiteUrl?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  xUrl?: string | null
  jobTitle?: string | null
  company?: string | null
  department?: string | null
  location?: string | null
}

export default function EditUserForm({ user }: { user: User }) {
  const router = useRouter()
  const { refetch } = useSession()

  const form = useForm<FormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      bio: user.bio ?? "",
      phone: user.phone ?? "",
      websiteUrl: user.websiteUrl ?? "",
      linkedinUrl: user.linkedinUrl ?? "",
      githubUrl: user.githubUrl ?? "",
      xUrl: user.xUrl ?? "",
      jobTitle: user.jobTitle ?? "",
      company: user.company ?? "",
      department: user.department ?? "",
      location: user.location ?? "",
    },
  })

  async function onSubmit(values: FormData) {
    try {
      const { data, error } = await authClient.admin.updateUser({
        userId: user.id,
        data: {
          email: values.email,
          name: values.name,
          bio: values.bio,
          phone: values.phone,
          websiteUrl: values.websiteUrl,
          linkedinUrl: values.linkedinUrl,
          githubUrl: values.githubUrl,
          xUrl: values.xUrl,
          jobTitle: values.jobTitle,
          company: values.company,
          department: values.department,
          location: values.location,
        },
      })

      if (error) {
        toast.error(error.message || "Failed to update user")
      } else {
        toast.success(`User ${data.email ?? ""} updated successfully`)
        form.reset({ ...values })
        router.refresh()
        refetch()
      }
    } catch {
      toast.error("Something went wrong")
    }
  }

  const { isSubmitting, isDirty } = form.formState

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="social">Social</TabsTrigger>
        <TabsTrigger value="job">Job</TabsTrigger>
      </TabsList>
      <Card className="mt-3">
        <CardContent>
          <form id="form-edit-user" onSubmit={form.handleSubmit(onSubmit)}>
            <TabsContent value="profile">
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
                <Controller
                  name="bio"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
                      <Textarea
                        {...field}
                        id={field.name}
                        placeholder="Tell us a little bit about yourself"
                        className="resize-none"
                        disabled={isSubmitting}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
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
            </TabsContent>
            <TabsContent value="social">
              <FieldGroup className="w-full md:w-2/3">
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
            </TabsContent>
            <TabsContent value="job">
              <FieldGroup className="w-full md:w-2/3">
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
            </TabsContent>
            <div className="mt-6 flex flex-col gap-4 md:flex-row">
              <Button
                type="submit"
                form="form-edit-user"
                className="w-full md:w-32"
                disabled={isSubmitting || !isDirty}
                size="sm"
              >
                {isSubmitting && <Spinner />} Save
              </Button>
              <Button size="sm" className="w-full md:w-32" variant="outline" asChild>
                <Link href="/admin/users/">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Tabs>
  )
}
