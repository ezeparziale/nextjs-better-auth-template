import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { PageHeader } from "@/components/page-header"
import { CreatePasswordForm } from "./_components/create-password-button"
import { DeleteAccountForm } from "./_components/delete-account-form"
import PasskeyManagement from "./_components/passkey-management.tsx"
import TwoFactorAuth from "./_components/two-factor-auth"
import { UpdatePasswordForm } from "./_components/update-password-form"

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

  const passKeys = await auth.api.listPasskeys({ headers: await headers() })
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
      <PasskeyManagement passKeys={passKeys} hasPasswordAccount={hasPasswordAccount} />
      <DeleteAccountForm userEmail={session.user.email} />
    </div>
  )
}
