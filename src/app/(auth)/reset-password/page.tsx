import type { Metadata } from "next"
import { redirect } from "next/navigation"
import ResetPasswordForm from "./_components/reset-password-form"

type SearchParams = Promise<{ token: string }>

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your password",
}

export default async function ResetPasswordPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const token = searchParams.token

  if (!token) redirect("/login")

  return <ResetPasswordForm token={token} />
}
