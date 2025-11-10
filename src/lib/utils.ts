import { clsx, type ClassValue } from "clsx"
import { formatDistanceToNow } from "date-fns"
import { format, formatInTimeZone, toZonedTime } from "date-fns-tz"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: Date) => {
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const localDate = toZonedTime(date, userTimeZone)

  const utcDateTime = formatInTimeZone(
    new Date(date.toISOString()),
    "UTC",
    "MMMM d, yyyy HH:mm:ss",
  )

  const localDateTime = format(localDate, "MMMM d, yyyy HH:mm:ss", {
    timeZone: userTimeZone,
  })

  const gmtOffset = format(localDate, "zzz", {
    timeZone: userTimeZone,
  })

  return {
    timeAgo: formatDistanceToNow(date, { addSuffix: true }),
    utcDateTime,
    localDateTime,
    localTimeZone: gmtOffset,
  }
}
