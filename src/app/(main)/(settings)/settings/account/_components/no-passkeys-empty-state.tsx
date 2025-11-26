import { KeyRoundIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

interface NoPasskeysEmptyStateProps {
  onAdd: () => void
}

export function NoPasskeysEmptyState({ onAdd }: NoPasskeysEmptyStateProps) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <KeyRoundIcon />
        </EmptyMedia>
        <EmptyTitle>No passkeys yet</EmptyTitle>
        <EmptyDescription>
          Create your first passkey to enable fast, secure, passwordless sign-in on this
          device.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm" onClick={onAdd} aria-label="Add passkey">
          <PlusIcon />
          Create your first passkey
        </Button>
      </EmptyContent>
    </Empty>
  )
}
