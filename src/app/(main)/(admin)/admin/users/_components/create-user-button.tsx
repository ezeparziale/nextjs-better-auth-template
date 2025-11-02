import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function CreateUserButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild>
          <Link
            href="/admin/users/new"
            className="flex items-center"
            aria-label="Create user"
            prefetch={true}
          >
            <PlusIcon aria-hidden="true" />
            <span className="hidden md:inline">Create user</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="md:hidden" align="end">
        Create user
      </TooltipContent>
    </Tooltip>
  )
}
