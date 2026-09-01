import { subDays } from "date-fns"
import { Users } from "lucide-react"
import { db } from "@/lib/db"
import { StatCard } from "./stat-card"

export async function TotalUsersCard() {
  const thirtyDaysAgo = subDays(new Date(), 30)

  const [totalUsers, newUsersLast30Days] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
  ])

  return (
    <StatCard
      label="Total Users"
      value={totalUsers}
      hint={`${newUsersLast30Days} new in the last 30 days`}
      icon={Users}
      iconClassName="bg-blue-500/15 text-blue-500"
    />
  )
}
