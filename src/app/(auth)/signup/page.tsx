import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import SignUpForm from "./signup-form"

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
