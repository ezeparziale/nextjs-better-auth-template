import { startOfMonth, subMonths } from "date-fns"
import { UserPlus } from "lucide-react"
import { db } from "@/lib/db"
import { StatCard } from "./stat-card"

export async function NewThisMonthCard() {
  const now = new Date()
  const monthStart = startOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))

  const [newThisMonth, lastMonthNew] = await Promise.all([
    db.user.count({ where: { createdAt: { gte: monthStart } } }),
    db.user.count({
      where: { createdAt: { gte: lastMonthStart, lt: monthStart } },
    }),
  ])

  const deltaPercent =
    lastMonthNew === 0
      ? newThisMonth > 0
        ? 100
        : 0
      : Math.round(((newThisMonth - lastMonthNew) / lastMonthNew) * 100)

  return (
    <StatCard
      label="New This Month"
      value={newThisMonth}
      hint={`${deltaPercent >= 0 ? "+" : ""}${deltaPercent}% vs last month`}
      icon={UserPlus}
      iconClassName="bg-indigo-500/15 text-indigo-500"
      hintClassName={deltaPercent >= 0 ? "text-emerald-500" : "text-red-500"}
    />
  )
}
