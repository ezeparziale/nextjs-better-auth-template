import { InfoIcon } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function PasswordRequiredEmptyState() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <InfoIcon />
        </EmptyMedia>
        <EmptyTitle>Password Required</EmptyTitle>
        <EmptyDescription>
          Create a password first to enable passkey management.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
