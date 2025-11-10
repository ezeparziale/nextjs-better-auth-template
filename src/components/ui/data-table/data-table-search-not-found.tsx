import { LucideIcon } from "lucide-react"
import { Button } from "../button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../empty"

export function DataTableSearchNotFound({
  title,
  handleClearSearch,
  Icon,
}: {
  title: string
  handleClearSearch: () => void
  Icon: LucideIcon
}) {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>Try adjusting your search terms</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={handleClearSearch}>
          Clear search
        </Button>
      </EmptyContent>
    </Empty>
  )
}
