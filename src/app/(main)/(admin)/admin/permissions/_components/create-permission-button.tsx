"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export default function CreatePermissionButton() {
  const buttonRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "c" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        buttonRef.current?.click()
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild>
          <Link
            ref={buttonRef}
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
