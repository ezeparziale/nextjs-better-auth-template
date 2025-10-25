import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface EmailCardProps {
  email: string | null | undefined
  isPrimary: boolean
  isVerified: boolean
}

export default function EmailCard({ email, isPrimary, isVerified }: EmailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Email</CardTitle>
        <CardDescription>Your email address.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-input flex flex-wrap items-center gap-2 rounded-md border p-4">
          <p className="text-sm font-medium">{email}</p>
          {isPrimary && <Badge variant="green-subtle">Primary</Badge>}
          {isVerified && <Badge variant="blue-subtle">Verified</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}
