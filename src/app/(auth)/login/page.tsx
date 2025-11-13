import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import LogInForm from "./_components/login-form"

type SearchParams = Promise<{ callbackUrl?: string }>

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
}

export default async function LoginPage(props: { searchParams: SearchParams }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  const searchParams = await props.searchParams
  const { callbackUrl } = searchParams

  return <LogInForm callbackUrl={callbackUrl} />
}
