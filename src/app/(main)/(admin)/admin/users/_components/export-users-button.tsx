"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function ExportUsersButton() {
  const handleExport = () => {
    window.location.href = "/api/admin/users/export"
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" onClick={handleExport}>
          <Download aria-hidden="true" />
          <span className="hidden md:inline">Export CSV</span>
          <span className="sr-only">Export users as CSV</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="md:hidden" align="end">
        Export users
      </TooltipContent>
    </Tooltip>
  )
}
