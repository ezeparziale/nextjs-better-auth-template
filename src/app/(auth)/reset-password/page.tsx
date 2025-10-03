import { Metadata } from "next"
import ResetPasswordForm from "./reset-password-form"

type SearchParams = Promise<{ token: string }>

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset your password",
}

export default async function ResetPasswordPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const token = searchParams.token

  return <ResetPasswordForm token={token} />
}
