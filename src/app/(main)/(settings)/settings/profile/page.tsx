import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { PageHeader } from "@/components/page-header"
import { DeleteAccountForm } from "./delete-account-form"

export const metadata: Metadata = {
  title: "Profile",
  description: "Update your personal information.",
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect("/login?callbackUrl=/settings/profile")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Update your personal information."
        isSection
      />

      <div className="space-y-6">
        <DeleteAccountForm userEmail={session.user.email} />
      </div>
    </div>
  )
}
