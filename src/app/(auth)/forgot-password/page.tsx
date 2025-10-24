import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import ForgotPasswordForm from "./_components/forgot-password-form"

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your password",
}

export default async function ForgotPasswordPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  return <ForgotPasswordForm />
}
