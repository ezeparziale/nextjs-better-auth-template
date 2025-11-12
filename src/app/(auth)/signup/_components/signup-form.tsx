"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { signIn, signUp } from "@/lib/auth/auth-client"
import { signUpFormSchema, type SignUpForm } from "@/schemas/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { GitHubIcon, GoogleIcon } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type FormData = SignUpForm

export default function SignUpForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const form = useForm<FormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: FormData) {
    setIsLoading("email")
    try {
      const result = await signUp.email({
        email: values.email,
        name: values.name,
        password: values.password,
      })

      if (result.error) {
        toast.error(result.error.message || "Something went wrong")
      } else {
        toast.success("Sign up successful")
        setTimeout(() => {
          router.push("/login")
        }, 500)
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(null)
    }
  }

  const handleSocialSignUp = async (provider: "github" | "google") => {
    setIsLoading(provider)
    await signIn.social({ provider, callbackURL: "/dashboard" })
    setIsLoading(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your details below to sign up for an account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="form-signup" onSubmit={form.handleSubmit(onSubmit)}>
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
                    placeholder="Your name"
                    disabled={!!isLoading}
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
                    aria-invalid={fieldState.invalid}
                    placeholder="you@example.com"
                    type="email"
                    disabled={!!isLoading}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="••••••••"
                    type="password"
                    disabled={!!isLoading}
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
                  <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="••••••••"
                    type="password"
                    disabled={!!isLoading}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Button
              type="submit"
              form="form-signup"
              className="w-full"
              disabled={!!isLoading}
            >
              {isLoading === "email" ? <Spinner /> : "Create an account"}
            </Button>
            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              Or continue with
            </FieldSeparator>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSocialSignUp("github")}
              disabled={!!isLoading}
            >
              {isLoading === "github" ? (
                <Spinner />
              ) : (
                <>
                  <GitHubIcon />
                  GitHub
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSocialSignUp("google")}
              disabled={!!isLoading}
            >
              {isLoading === "google" ? (
                <Spinner />
              ) : (
                <>
                  <GoogleIcon />
                  Google
                </>
              )}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <FieldDescription>
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </FieldDescription>
      </CardFooter>
    </Card>
  )
}
