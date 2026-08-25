"use client"

import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

const COPY_RESET_DELAY_MS = 2000
const DEFAULT_TOAST_MESSAGE = "ID copied to clipboard"

type UseCopyToClipboardOptions = {
  toastMessage?: string
}

function useCopyToClipboard({
  toastMessage = DEFAULT_TOAST_MESSAGE,
}: UseCopyToClipboardOptions = {}) {
  const [copied, setCopied] = React.useState<string | null>(null)
  const resetTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const copy = React.useCallback(
    (value: string) => {
      navigator.clipboard.writeText(value).then(() => {
        setCopied(value)
        if (toastMessage) toast.info(toastMessage)

        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
        resetTimeoutRef.current = setTimeout(() => setCopied(null), COPY_RESET_DELAY_MS)
      })
    },
    [toastMessage],
  )

  React.useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
    }
  }, [])

  return { copied, copy }
}

type CopyButtonProps = Omit<React.ComponentProps<typeof Button>, "onClick"> & {
  value: string
  label?: string
  toastMessage?: string
}

function CopyButton({
  value,
  label = "Copy to clipboard",
  toastMessage,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: CopyButtonProps) {
  const { copied, copy } = useCopyToClipboard({ toastMessage })

  return (
    <Button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => copy(value)}
      variant={variant}
      size={size}
      {...props}
    >
      {copied === value ? <CheckIcon /> : <CopyIcon />}
    </Button>
  )
}

export { CopyButton, useCopyToClipboard }
