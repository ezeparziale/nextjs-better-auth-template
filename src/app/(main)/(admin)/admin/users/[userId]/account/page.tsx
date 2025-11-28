import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { getUser } from "@/data/auth/get-user"
import { PageHeader } from "@/components/page-header"
import { BanUserCard } from "./_components/ban-user-card"
import { EmailVerifiedCard } from "./_components/email-verified-card"

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
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const params = await props.params
  const userId = params.userId

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/dashboard")

  const user = await getUser(userId)

  if (!user) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <EmailVerifiedCard
        userId={user.id}
        emailVerified={user.emailVerified}
        email={user.email}
      />
      <BanUserCard
        userId={user.id}
        isBanned={!!user.banned}
        email={user.email}
        banReason={user.banReason}
        banExpires={user.banExpires}
      />
    </div>
  )
}
