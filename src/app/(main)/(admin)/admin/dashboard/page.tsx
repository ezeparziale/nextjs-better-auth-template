import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/page-header"
import { DashboardCharts } from "./_components/dashboard-charts"
import { DashboardStats } from "./_components/dashboard-stats"

const PAGE = {
  title: "Dashboard",
  description: "Admin dashboard.",
  callbackUrl: "/admin/dashboard",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function DashboardAdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}`)

  if (session.user.role !== "admin") redirect("/error?error=access_unauthorized")

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
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} divider />
      <DashboardStats
        totalUsers={totalUsers}
        activeUsers={activeUsers}
        totalRoles={totalRoles}
        totalPermissions={totalPermissions}
      />
      <DashboardCharts />
    </div>
  )
}
