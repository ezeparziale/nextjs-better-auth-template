import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import LogInForm from "./login-form"

export default async function SignInPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  return <LogInForm />
}
