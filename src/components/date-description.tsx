"use client"

import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type DateDescriptionProps = {
  date?: Date | null
  fallbackText?: string
}

type DateTableProps = {
  utcDateTime: string
  localDateTime: string
  localTimeZone: string
  timestamp: number
  copied: string | null
  onCopy: (text: string, label: string) => void
}

const DateTable = ({
  utcDateTime,
  localDateTime,
  localTimeZone,
  timestamp,
  copied,
  onCopy,
}: DateTableProps) => (
  <table className="text-left text-xs">
    <tbody>
      <tr
        className="hover:bg-muted cursor-pointer transition-colors"
        onClick={() => onCopy(utcDateTime, "UTC")}
      >
        <td className="pr-2 font-mono font-semibold">UTC</td>
        <td className="font-mono">{utcDateTime}</td>
        <td className="pl-2">
          {copied === "UTC" ? (
            <Check className="size-3 text-green-500" />
          ) : (
            <Copy className="text-muted-foreground size-3 opacity-70" />
          )}
        </td>
      </tr>

      <tr
        className="hover:bg-muted cursor-pointer transition-colors"
        onClick={() => onCopy(localDateTime, "Local")}
      >
        <td className="pr-2 font-mono font-semibold">{localTimeZone}</td>
        <td className="font-mono">{localDateTime}</td>
        <td className="pl-2">
          {copied === "Local" ? (
            <Check className="size-3 text-green-500" />
          ) : (
            <Copy className="text-muted-foreground size-3 opacity-70" />
          )}
        </td>
      </tr>

      <tr
        className="hover:bg-muted cursor-pointer transition-colors"
        onClick={() => onCopy(timestamp.toString(), "Timestamp")}
      >
        <td className="pr-2 font-mono font-semibold">Timestamp</td>
        <td className="font-mono">{timestamp}</td>
        <td className="pl-2">
          {copied === "Timestamp" ? (
            <Check className="size-3 text-green-500" />
          ) : (
            <Copy className="text-muted-foreground size-3 opacity-70" />
          )}
        </td>
      </tr>
    </tbody>
  </table>
)

export const DateDescription = ({
  date,
  fallbackText = "N/A",
}: DateDescriptionProps) => {
  const [copied, setCopied] = useState<string | null>(null)
  const isMobile = useIsMobile()

  if (!date) {
    return <span className="text-sm text-gray-500">{fallbackText}</span>
  }

  const { timeAgo, utcDateTime, localDateTime, localTimeZone } = formatDate(date)
  const timestamp = date.getTime()

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    })
    toast.info("Copied to clipboard")
  }

  const content = (
    <DateTable
      utcDateTime={utcDateTime}
      localDateTime={localDateTime}
      localTimeZone={localTimeZone}
      timestamp={timestamp}
      copied={copied}
      onCopy={copyToClipboard}
    />
  )

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <span className="cursor-pointer text-sm text-gray-500 underline decoration-dashed">
            {timeAgo}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">{content}</PopoverContent>
      </Popover>
    )
  }

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="cursor-pointer text-sm text-gray-500 underline decoration-dashed">
          {timeAgo}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-auto p-2">{content}</HoverCardContent>
    </HoverCard>
  )
}
