import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { requireAdmin } from "@/lib/auth/guards"
import { getUser } from "@/data/auth/get-user"
import { PageHeader } from "@/components/page-header"
import AccountStatusCard from "./_components/account-status-card"
import ImpersonateUserCard from "./_components/impersonate-user-card"
import { ResetPasswordCard } from "./_components/reset-password-card"
import { SetRoleCard } from "./_components/set-role-card"
import { SetTemporaryPasswordCard } from "./_components/set-temporary-password-card"

const PAGE = {
  title: "Account",
  description: "Manage user account.",
  callbackUrl: "/admin/users",
  section: "account",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ userId: string }>

export default async function AccountUserAdminPage(props: { params: Params }) {
  const { userId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  const user = await getUser(userId)

  if (!user) notFound()

  const { hasCredentialAccount } = await auth.api.userHasCredentialAccount({
    body: { userId },
    headers: await headers(),
  })

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <AccountStatusCard
        data={{
          userId: user.id,
          email: user.email,
          banned: user.banned,
          emailVerified: user.emailVerified,
          banReason: user.banReason,
          banExpires: user.banExpires,
        }}
      />
      <SetRoleCard userId={userId} currentRole={user.role ?? "user"} />
      <SetTemporaryPasswordCard userId={userId} />
      <ResetPasswordCard userId={userId} hasCredentialAccount={hasCredentialAccount} />
      <ImpersonateUserCard userId={userId} />
    </div>
  )
}
