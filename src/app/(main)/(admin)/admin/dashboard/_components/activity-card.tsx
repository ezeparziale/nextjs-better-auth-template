import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns"
import { db } from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ActivityChart } from "./activity-chart"

const DAY_KEY = "yyyy-MM-dd"

export async function ActivityCard() {
  const today = startOfDay(new Date())

  const sessions = await db.session.findMany({
    where: { createdAt: { gte: subDays(today, 6) } },
    select: { createdAt: true, userId: true },
  })

  const activeByDay = new Map<string, Set<string>>()
  for (const session of sessions) {
    const key = format(session.createdAt, DAY_KEY)
    const users = activeByDay.get(key) ?? new Set<string>()
    users.add(session.userId)
    activeByDay.set(key, users)
  }

  const data = eachDayOfInterval({
    start: subDays(today, 6),
    end: today,
  }).map((day) => ({
    name: format(day, "EEE"),
    active: activeByDay.get(format(day, DAY_KEY))?.size ?? 0,
  }))

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Active users per day for the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ActivityChart data={data} />
      </CardContent>
    </Card>
  )
}
