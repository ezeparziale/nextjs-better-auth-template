"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { ForgotPasswordFormSchema, type ForgotPasswordForm } from "@/schemas/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type FormData = ForgotPasswordForm

export default function ForgotPasswordForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<FormData>({
    resolver: zodResolver(ForgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: FormData) {
    setIsLoading(true)
    try {
      const result = await authClient.requestPasswordReset({ email: values.email })

      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success("Password reset link sent to your email")
        form.reset()
        setTimeout(() => {
          router.push("/login")
        }, 500)
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-forgot-password" onSubmit={form.handleSubmit(onSubmit)}>
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
                    aria-invalid={fieldState.invalid}
                    type="email"
                    aria-label="Email address to receive reset link"
                    disabled={isLoading}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="flex flex-col gap-4">
              <Button
                type="submit"
                form="form-forgot-password"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Spinner />
                    Sending…
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
              <Button variant="ghost" className="w-full" disabled={isLoading} asChild>
                <Link href="/login">Back to login</Link>
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
