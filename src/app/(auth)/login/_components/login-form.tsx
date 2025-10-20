"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { GitHubIcon, GoogleIcon } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={"flex flex-col gap-6"}>
          <Card>
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            type="email"
                            disabled={!!loadingProvider}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <Link
                            href="/forgot-password"
                            className="text-muted-foreground ml-auto inline-block text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            disabled={!!loadingProvider}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={!!loadingProvider}>
                    {loadingProvider === "email" ? <Spinner /> : "Log In"}
                  </Button>

                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div>

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
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <p className="text-muted-foreground text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
