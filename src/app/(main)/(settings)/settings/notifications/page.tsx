import type { Metadata } from "next"
import { requireSession } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"
import NotificationsForm from "./_components/notifications-form"

const PAGE = definePage({
  title: "Notifications",
  description: "Manage your notification preferences",
  callbackUrl: "/settings/notifications",
})

export const metadata: Metadata = PAGE.metadata

export default async function NotificationsPage() {
  const session = await requireSession(PAGE.callbackUrl)

  return (
    <PageShell page={PAGE} isSection>
      <NotificationsForm
        notificationNewLoginEmail={session.user.notificationNewLoginEmail ?? true}
      />
    </PageShell>
  )
}
