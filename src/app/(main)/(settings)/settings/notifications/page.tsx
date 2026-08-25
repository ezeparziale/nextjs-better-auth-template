import type { Metadata } from "next"
import { requireSession } from "@/lib/auth/guards"
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
  const session = await requireSession(PAGE.callbackUrl)

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <NotificationsForm
        notificationNewLoginEmail={session.user.notificationNewLoginEmail ?? true}
      />
    </div>
  )
}
