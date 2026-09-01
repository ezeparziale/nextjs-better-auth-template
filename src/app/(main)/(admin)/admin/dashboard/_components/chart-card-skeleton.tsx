import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ChartCardSkeletonProps {
  className?: string
  bars?: boolean
}

export function ChartCardSkeleton({ className, bars = false }: ChartCardSkeletonProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent className="pl-2">
        <ChartAreaSkeleton bars={bars} />
      </CardContent>
    </Card>
  )
}

function ChartAreaSkeleton({ bars }: { bars?: boolean }) {
  return (
    <div className="relative h-[350px] w-full">
      <div className="absolute inset-0 flex flex-col justify-between py-1">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-border h-px w-full" />
        ))}
      </div>
      <div className="absolute inset-0 flex items-end gap-2 pr-2">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className={`bg-accent flex-1 animate-pulse rounded-t-md ${bars ? "" : "rounded-b-md"}`}
            style={{
              height: `${22 + ((index * 17) % 58)}%`,
              opacity: 1 - index * 0.05,
            }}
          />
        ))}
      </div>
    </div>
  )
}
