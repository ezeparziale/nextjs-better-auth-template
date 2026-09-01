import type { Metadata } from "next"
import { Suspense } from "react"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"
import { ActiveNowCard } from "./_components/active-now-card"
import { ActivityCard } from "./_components/activity-card"
import { ChartCardSkeleton } from "./_components/chart-card-skeleton"
import { NewThisMonthCard } from "./_components/new-this-month-card"
import { RolesCard } from "./_components/roles-card"
import { SignupsCard } from "./_components/signups-card"
import { StatCardSkeleton } from "./_components/stat-card-skeleton"
import { TotalUsersCard } from "./_components/total-users-card"

const PAGE = definePage({
  title: "Dashboard",
  description: "Admin dashboard.",
  callbackUrl: "/admin/dashboard",
})

export const metadata: Metadata = PAGE.metadata

export default async function DashboardAdminPage() {
  await requireAdmin(PAGE.callbackUrl)

  return (
    <PageShell page={PAGE} divider>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<StatCardSkeleton />}>
          <TotalUsersCard />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <ActiveNowCard />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <NewThisMonthCard />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <RolesCard />
        </Suspense>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Suspense fallback={<ChartCardSkeleton className="lg:col-span-4" bars />}>
          <SignupsCard />
        </Suspense>
        <Suspense fallback={<ChartCardSkeleton className="lg:col-span-3" />}>
          <ActivityCard />
        </Suspense>
      </div>
    </PageShell>
  )
}
