import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function CreateRoleButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild>
          <Link
            href="/admin/roles/new"
            className="flex items-center"
            aria-label="Create role"
            prefetch={true}
          >
            <PlusIcon aria-hidden="true" />
            <span className="hidden md:inline">Create role</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="md:hidden" align="end">
        Create role
      </TooltipContent>
    </Tooltip>
  )
}
