import type { Metadata } from "next"
import { requireSession } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"

const PAGE = definePage({
  title: "Dashboard",
  description: "Your dashboard.",
  callbackUrl: "/dashboard",
})

export const metadata: Metadata = PAGE.metadata

export default async function DashboardPage() {
  const session = await requireSession(PAGE.callbackUrl)

  return (
    <PageShell page={PAGE} divider>
      <p className="text-lg">
        👋 Welcome, <span className="font-semibold">{session.user.name}</span>!
      </p>
    </PageShell>
  )
}
