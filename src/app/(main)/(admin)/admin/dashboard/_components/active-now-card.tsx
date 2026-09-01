import { Activity } from "lucide-react"
import { db } from "@/lib/db"
import { StatCard } from "./stat-card"

export async function ActiveNowCard() {
  const sessions = await db.session.groupBy({
    by: ["userId"],
    where: { expiresAt: { gt: new Date() } },
  })

  return (
    <StatCard
      label="Active Now"
      value={sessions.length}
      hint="Users with a session not expired"
      icon={Activity}
      iconClassName="bg-green-500/15 text-green-500"
    />
  )
}
