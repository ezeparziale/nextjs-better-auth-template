import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { PageHeader } from "@/components/page-header"
import { CreatePasswordForm } from "./_components/create-password-button"
import { DeleteAccountForm } from "./_components/delete-account-form"
import { UpdatePasswordForm } from "./_components/update-password-form"
import { CreatePasswordForm } from "./create-password-button"
import { DeleteAccountForm } from "./delete-account-form"
import TwoFactorAuth from "./two-factor-auth"
import { UpdatePasswordForm } from "./update-password-form"

const PAGE = {
  title: "Account",
  description: "Manage your account settings",
  callbackUrl: "/settings/account",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  const accounts = await auth.api.listUserAccounts({ headers: await headers() })
  const hasPasswordAccount = accounts.some(
    (account) => account.providerId === "credential",
  )

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      {hasPasswordAccount ? (
        <UpdatePasswordForm />
      ) : (
        <CreatePasswordForm email={session.user.email} />
      )}
      <TwoFactorAuth
        isEnabled={session.user.twoFactorEnabled ?? false}
        hasPasswordAccount={hasPasswordAccount}
      />
      <DeleteAccountForm userEmail={session.user.email} />
    </div>
  )
}
