import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { PageHeader } from "@/components/page-header"
import { DeleteAccountForm } from "./delete-account-form"

const PAGE = {
  title: "Profile",
  description: "Update your personal information",
  callbackUrl: "/settings/profile",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <DeleteAccountForm userEmail={session.user.email} />
    </div>
  )
}
