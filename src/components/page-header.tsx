"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./ui/button"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  isSection?: boolean
  divider?: boolean
  backLink?: string
  mobileActionsBelow?: boolean
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  isSection = false,
  divider = false,
  backLink,
  mobileActionsBelow = true,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "relative",
        mobileActionsBelow
          ? "flex flex-col space-y-2"
          : "flex flex-row items-start justify-between",
        "sm:flex-row sm:items-center sm:justify-between sm:space-y-0",
        (divider || isSection) && "border-b pb-4",
        "mt-4",
        className,
      )}
    >
      {backLink && (
        <Button
          size="sm"
          variant="link"
          className="text-muted-foreground absolute -top-10 left-0 has-[>svg]:px-0"
          asChild
        >
          <Link href={backLink} prefetch={false}>
            <ArrowLeft className="size-4" />
            <span className="text-sm">Back</span>
          </Link>
        </Button>
      )}
      <div className="space-y-1">
        <h2
          className={cn(
            "font-semibold tracking-tight",
            isSection ? "text-lg" : "text-2xl",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  )
}
