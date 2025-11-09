import Link from "next/link"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function CreatePermissionButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild>
          <Link
            href="/admin/permissions/new"
            className="flex items-center"
            aria-label="Create permission"
            prefetch={true}
          >
            <PlusIcon aria-hidden="true" />
            <span className="hidden md:inline">Create permission</span>
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="md:hidden" align="end">
        Create permission
      </TooltipContent>
    </Tooltip>
  )
}
