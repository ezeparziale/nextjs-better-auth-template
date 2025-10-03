import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import SignUpForm from "./signup-form"

export default async function SignUpPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  return <SignUpForm />
}
