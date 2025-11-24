import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getUser } from "@/data/auth/get-user"
import { PageHeader } from "@/components/page-header"
import ImpersonateUserCard from "./_components/impersonate-user-card"
import { ResetPasswordCard } from "./_components/reset-password-card"
import { SetRoleCard } from "./_components/set-role-card"
import { SetTemporaryPasswordCard } from "./_components/set-temporary-password-card"

const PAGE = {
  title: "Actions",
  description: "Manage user actions.",
  callbackUrl: "/admin/users",
  section: "actions",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ userId: string }>

export default async function ActionsUserAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { userId } = await props.params

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/dashboard")

  const { hasCredentialAccount } = await auth.api.userHasCredentialAccount({
    body: { userId },
    headers: await headers(),
  })

  const user = await getUser(userId)

  if (!user) return null

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <SetRoleCard userId={userId} currentRole={user.role ?? "user"} />
      <SetTemporaryPasswordCard userId={userId} />
      <ResetPasswordCard userId={userId} hasCredentialAccount={hasCredentialAccount} />
      <ImpersonateUserCard userId={userId} />
    </div>
  )
}
