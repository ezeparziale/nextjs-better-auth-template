import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"

interface PageShellProps {
  page: { title: string; description?: string }
  actions?: React.ReactNode
  className?: string
  isSection?: boolean
  divider?: boolean
  backLink?: string
  mobileActionsBelow?: boolean
  copyValue?: string
  copyLabel?: string
  children: React.ReactNode
}

export function PageShell({
  page,
  actions,
  className,
  isSection = false,
  divider = false,
  backLink,
  mobileActionsBelow = true,
  copyValue,
  copyLabel,
  children,
}: PageShellProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <PageHeader
        title={page.title}
        description={page.description}
        actions={actions}
        isSection={isSection}
        divider={divider}
        backLink={backLink}
        mobileActionsBelow={mobileActionsBelow}
        copyValue={copyValue}
        copyLabel={copyLabel}
      />
      {children}
    </div>
  )
}
