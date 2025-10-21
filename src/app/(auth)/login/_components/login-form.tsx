"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { signIn } from "@/lib/auth-client"
import { LogInFormSchema, type LogInForm } from "@/schemas/auth"
import { Badge } from "@/components/ui/badge"
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
import PasskeyButton from "./passkey-button"

type FormData = LogInForm

export default function LogInForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter()
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [lastSignInMethod, setLastSignInMethod] = useState<string | null>(null)

  useEffect(() => {
    const lastMethod = localStorage.getItem("last-sign-in-method")
    if (lastMethod) {
      setLastSignInMethod(lastMethod)
    }
  }, [])

  const form = useForm<FormData>({
    resolver: zodResolver(LogInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: FormData) {
    setLoadingProvider("email")
    try {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
      })

      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          router.push(`/verify-email?email=${values.email}`)
          toast.info("Email not verified")
        } else {
          toast.error(result.error.message || "Something went wrong")
        }
      } else {
        router.push(callbackUrl || "/dashboard")
      }
    } catch {
      toast.error("Something went wrong")
    } finally {
      setLoadingProvider(null)
    }
  }

  const handleSocialSignIn = async (provider: "github" | "google") => {
    setLoadingProvider(provider)
    localStorage.setItem("last-sign-in-method", provider)
    await signIn.social({ provider, callbackURL: callbackUrl || "/dashboard" })
    setLoadingProvider(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
        <CardDescription>
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-login"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
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
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email webauthn"
                    disabled={!!loadingProvider}
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
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Link
                      href="/forgot-password"
                      className="text-muted-foreground ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    autoComplete="current-password webauthn"
                    placeholder="••••••••"
                    type="password"
                    disabled={!!loadingProvider}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Button
              type="submit"
              form="form-login"
              className="w-full"
              disabled={!!loadingProvider}
            >
              {loadingProvider === "email" ? <Spinner /> : "Log In"}
            </Button>
            <PasskeyButton loading={!!loadingProvider} />
            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              Or continue with
            </FieldSeparator>
            <Button
              type="button"
              variant="outline"
              className="relative w-full"
              onClick={() => handleSocialSignIn("github")}
              disabled={!!loadingProvider}
            >
              {lastSignInMethod === "github" && (
                <Badge className="absolute -top-2 -right-2">Last used</Badge>
              )}
              {loadingProvider === "github" ? (
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
              className="relative w-full"
              onClick={() => handleSocialSignIn("google")}
              disabled={!!loadingProvider}
            >
              {lastSignInMethod === "google" && (
                <Badge className="absolute -top-2 -right-2">Last used</Badge>
              )}
              {loadingProvider === "google" ? (
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
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </FieldDescription>
      </CardFooter>
    </Card>
  )
}
