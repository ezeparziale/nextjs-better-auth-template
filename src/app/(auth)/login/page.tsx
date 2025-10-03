import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import LogInForm from "./login-form"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
}

export default async function SignInPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  return <LogInForm />
}
