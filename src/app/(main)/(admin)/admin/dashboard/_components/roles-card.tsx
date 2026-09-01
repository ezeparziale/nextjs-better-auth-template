import { Shield } from "lucide-react"
import { db } from "@/lib/db"
import { StatCard } from "./stat-card"

export async function RolesCard() {
  const [totalRoles, activeRoles] = await Promise.all([
    db.role.count(),
    db.role.count({ where: { is_active: true } }),
  ])

  return (
    <StatCard
      label="Roles"
      value={totalRoles}
      hint={`${activeRoles} of ${totalRoles} active`}
      icon={Shield}
      iconClassName="bg-orange-500/15 text-orange-500"
    />
  )
}
