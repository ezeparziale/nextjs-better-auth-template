import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  iconClassName?: string
  hintClassName?: string
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClassName,
  hintClassName,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md",
            iconClassName,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn("text-muted-foreground text-xs", hintClassName)}>{hint}</p>
      </CardContent>
    </Card>
  )
}
