import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"

export const metadata: Metadata = {
  title: "Logout",
  description: "Sign out of your account",
}

export default async function SignOutPage() {
  await auth.api.signOut({
    headers: await headers(),
  })

  redirect("/")
}
