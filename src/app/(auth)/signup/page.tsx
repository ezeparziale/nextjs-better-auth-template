import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import SignUpForm from "./_components/signup-form"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create an account",
}

export default async function SignUpPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  return <SignUpForm />
}
