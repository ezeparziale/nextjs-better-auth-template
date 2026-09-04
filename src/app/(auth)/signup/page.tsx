import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import SignUpForm from "./_components/signup-form"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create an account",
}

type SearchParams = Promise<{ token?: string }>

export default async function SignUpPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect("/dashboard")
  }

  return <SignUpForm token={searchParams.token} />
}
