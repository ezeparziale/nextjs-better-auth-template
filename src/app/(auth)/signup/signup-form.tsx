"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { signIn, signUp } from "@/lib/auth-client"
import { SignUpFormSchema, type SignUpForm } from "@/schemas/auth"
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

type FormData = SignUpForm

export default function SignUpForm() {
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
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(values: FormData) {
    setLoadingProvider("email")
    try {
      const result = await signUp.email({
        email: values.email,
        name: values.name,
        password: values.password,
      })

      if (result.error) {
        form.setError("email", { message: result.error.message })
      } else {
        toast.success("Sign up successful!")
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoadingProvider(null)
    }
  }

  const handleSocialSignIn = async (provider: "github" | "google") => {
    setLoadingProvider(provider)
    localStorage.setItem("last-sign-in-method", provider)
    await signIn.social({ provider, callbackURL: "/dashboard" })
    setLoadingProvider(null)
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>
                Enter your details below to sign up for an account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your name"
                            disabled={!!loadingProvider}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <FormLabel>Password</FormLabel>
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

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
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
                    {loadingProvider === "email" ? <Spinner /> : "Create an account"}
                  </Button>

                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div>

                  <Button
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
                    variant="outline"
                    type="button"
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
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Log In
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
