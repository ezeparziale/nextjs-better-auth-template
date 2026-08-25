import type { Metadata } from "next"
import { requireAdmin } from "@/lib/auth/guards"
import { db } from "@/lib/db"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"
import { DashboardCharts } from "./_components/dashboard-charts"
import { DashboardStats } from "./_components/dashboard-stats"

const PAGE = definePage({
  title: "Dashboard",
  description: "Admin dashboard.",
  callbackUrl: "/admin/dashboard",
})

export const metadata: Metadata = PAGE.metadata

export default async function DashboardAdminPage() {
  await requireAdmin(PAGE.callbackUrl)

  const [totalUsers, activeSessionGroups, totalRoles, totalPermissions] =
    await Promise.all([
      db.user.count(),
      db.session.groupBy({
        by: ["userId"],
      }),
      db.role.count(),
      db.permission.count(),
    ])

  const activeUsers = activeSessionGroups.length

  return (
    <PageShell page={PAGE} divider>
      <DashboardStats
        totalUsers={totalUsers}
        activeUsers={activeUsers}
        totalRoles={totalRoles}
        totalPermissions={totalPermissions}
      />
      <DashboardCharts />
    </PageShell>
  )
}
