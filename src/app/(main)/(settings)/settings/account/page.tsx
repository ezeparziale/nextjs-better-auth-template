import type { Metadata } from "next"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/auth"
import { requireSession } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"
import { CreatePasswordForm } from "./_components/create-password-button"
import { DeleteAccountForm } from "./_components/delete-account-form"
import PasskeyManagement from "./_components/passkey-management.tsx"
import TwoFactorAuth from "./_components/two-factor-auth"
import { UpdatePasswordForm } from "./_components/update-password-form"

const PAGE = definePage({
  title: "Account",
  description: "Manage your account settings",
  callbackUrl: "/settings/account",
})

export const metadata: Metadata = PAGE.metadata

export default async function AccountPage() {
  const session = await requireSession(PAGE.callbackUrl)

  const passKeys = await auth.api.listPasskeys({ headers: await headers() })
  const accounts = await auth.api.listUserAccounts({ headers: await headers() })
  const hasPasswordAccount = accounts.some(
    (account) => account.providerId === "credential",
  )

  return (
    <PageShell page={PAGE} isSection>
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
    </PageShell>
  )
}
