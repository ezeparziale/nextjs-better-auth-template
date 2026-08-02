import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { PageHeader } from "@/components/page-header"
import NotificationsForm from "./_components/notifications-form"

const PAGE = {
  title: "Notifications",
  description: "Manage your notification preferences",
  callbackUrl: "/settings/notifications",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function NotificationsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <NotificationsForm
        notificationNewLoginEmail={session.user.notificationNewLoginEmail ?? true}
      />
    </div>
  )
}
