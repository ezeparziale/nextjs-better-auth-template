"use client"

import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
  isSection?: boolean
}

export function PageHeader({
  title,
  description,
  actions,
  className,
  isSection = false,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0",
        isSection && "border-b pb-4",
        className,
      )}
    >
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
      {actions ? <div>{actions}</div> : null}
    </div>
  )
}
