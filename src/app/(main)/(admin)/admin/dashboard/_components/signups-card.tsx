import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns"
import { db } from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SignupsChart } from "./signups-chart"

const DAY_KEY = "yyyy-MM-dd"

export async function SignupsCard() {
  const today = startOfDay(new Date())

  const users = await db.user.findMany({
    where: { createdAt: { gte: subDays(today, 29) } },
    select: { createdAt: true },
  })

  const counts = new Map<string, number>()
  for (const user of users) {
    const key = format(user.createdAt, DAY_KEY)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const data = eachDayOfInterval({
    start: subDays(today, 29),
    end: today,
  }).map((day) => ({
    name: format(day, "MMM d"),
    total: counts.get(format(day, DAY_KEY)) ?? 0,
  }))

  return (
    <Card className="col-span-1 lg:col-span-4">
      <CardHeader>
        <CardTitle>Signups</CardTitle>
        <CardDescription>New users per day for the last 30 days.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <SignupsChart data={data} />
      </CardContent>
    </Card>
  )
}
