import ResetPasswordForm from "./reset-password-form"

type SearchParams = Promise<{ token: string }>

export default async function ResetPasswordPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const token = searchParams.token

  return <ResetPasswordForm token={token} />
}
