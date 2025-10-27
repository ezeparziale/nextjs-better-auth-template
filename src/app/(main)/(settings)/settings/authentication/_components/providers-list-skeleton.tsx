import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProvidersListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Providers</CardTitle>
        <CardDescription>Customize how you access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ProviderCardSkeleton />
          <ProviderCardSkeleton />
          <ProviderCardSkeleton />
        </div>
      </CardContent>
    </Card>
  )
}

function ProviderCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-20" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-40" />
        </CardDescription>
        <CardAction>
          <Skeleton className="h-8 w-20" />
        </CardAction>
      </CardHeader>
    </Card>
  )
}
