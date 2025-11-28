import { Activity, Key, Shield, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardStatsProps {
  totalUsers: number
  activeUsers: number
  totalRoles: number
  totalPermissions: number
}

export function DashboardStats({
  totalUsers,
  activeUsers,
  totalRoles,
  totalPermissions,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/15">
            <Users className="h-5 w-5 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-muted-foreground text-xs">+20.1% from last month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-green-500/15">
            <Activity className="h-5 w-5 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeUsers}</div>
          <p className="text-muted-foreground text-xs">Based on active sessions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-500/15">
            <Shield className="h-5 w-5 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRoles}</div>
          <p className="text-muted-foreground text-xs">System roles</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Permissions</CardTitle>
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-purple-500/15">
            <Key className="h-5 w-5 text-purple-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPermissions}</div>
          <p className="text-muted-foreground text-xs">System permissions</p>
        </CardContent>
      </Card>
    </div>
  )
}
