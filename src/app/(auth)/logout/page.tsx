import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function SignOutPage() {
  await auth.api.signOut({
    headers: await headers(),
  })

  redirect("/")
}
