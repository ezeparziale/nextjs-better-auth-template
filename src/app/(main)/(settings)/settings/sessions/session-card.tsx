"use client"

import { useState } from "react"
import { Session } from "better-auth"
import { formatDistanceToNow } from "date-fns"
import {
  GlobeIcon,
  MonitorIcon,
  SmartphoneIcon,
  TabletIcon,
  TrashIcon,
} from "lucide-react"
import { UAParser } from "ua-parser-js"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

interface SessionCardProps {
  session: Session
  onRevoke?: (token: string) => void
  isCurrent?: boolean
  isRevoking?: boolean
}

function getDeviceIcon(deviceType?: string) {
  switch (deviceType?.toLowerCase()) {
    case "mobile":
      return <SmartphoneIcon className="size-5" />
    case "tablet":
      return <TabletIcon className="size-5" />
    default:
      return <MonitorIcon className="size-5" />
  }
}

function maskIP(ip?: string) {
  if (!ip) return null
  if (ip.includes(".")) {
    const parts = ip.split(".")
    return `${parts[0]}.${parts[1]}.***.***`
  }
  if (ip.includes(":")) {
    const parts = ip.split(":")
    return `${parts.slice(0, 4).join(":")}:****:****:****:****`
  }
  return ip
}

export function SessionCard({
  session,
  onRevoke,
  isCurrent = false,
  isRevoking = false,
}: SessionCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const parser = new UAParser(session.userAgent || "")
  const result = parser.getResult()
  const browser = result.browser.name || "Unknown Browser"
  const browserVersion = result.browser.version
    ? ` ${result.browser.version.split(".")[0]}`
    : ""
  const os = result.os.name || "Unknown OS"
  const osVersion = result.os.version ? ` ${result.os.version}` : ""
  const deviceType = result.device.type || "desktop"
  const deviceModel = result.device.model
  const deviceDescription = `${browser}${browserVersion} on ${os}${osVersion}${
    deviceModel ? ` (${deviceModel})` : ""
  }`

  const formattedDate = formatDistanceToNow(new Date(session.createdAt), {
    addSuffix: true,
  })

  const expiresAt = new Date(
    session.expiresAt ||
      new Date(session.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000,
  )
  const daysUntilExpiry = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  )

  const handleRevokeClick = () => setShowConfirmDialog(true)

  const handleConfirmRevoke = () => {
    onRevoke?.(session.token)
    setShowConfirmDialog(false)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <span className="bg-muted inline-flex size-8 items-center justify-center rounded-md p-2">
                {getDeviceIcon(deviceType)}
              </span>
              {deviceDescription}
            </CardTitle>

            {isCurrent && <Badge variant="outline">Current Session</Badge>}
          </div>

          {onRevoke && !isCurrent && (
            <div className="ml-auto hidden shrink-0 sm:block">
              <Button
                variant="destructive"
                size="sm"
                disabled={isRevoking}
                onClick={handleRevokeClick}
                aria-label={`Revoke session from ${deviceDescription}}`}
                aria-busy={isRevoking}
              >
                {isRevoking ? (
                  <span className="flex items-center gap-2" aria-live="polite">
                    <Spinner className="size-4" />
                    <span>Revoking…</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <TrashIcon className="size-4" />
                    <span>Revoke</span>
                  </span>
                )}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-1 text-sm">
            {!isCurrent && (
              <>
                <CardDescription title={new Date(session.createdAt).toISOString()}>
                  <span>Last active {formattedDate}</span>
                </CardDescription>
                {daysUntilExpiry > 0 ? (
                  <CardDescription className="text-xs" title={expiresAt.toISOString()}>
                    Expires in {daysUntilExpiry}{" "}
                    {daysUntilExpiry === 1 ? "day" : "days"}
                  </CardDescription>
                ) : (
                  <CardDescription className="text-destructive text-xs">
                    Session expired
                  </CardDescription>
                )}
              </>
            )}
          </div>

          <details className="mt-2">
            <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs">
              Show details
            </summary>
            <div className="text-muted-foreground mt-2 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <GlobeIcon className="size-3.5" />
                <span>
                  {session.ipAddress ? maskIP(session.ipAddress) : "IP not available"}
                </span>
              </div>
              <div>User agent: {session.userAgent || "Unknown"}</div>
            </div>
          </details>
        </CardContent>

        {onRevoke && !isCurrent && (
          <CardFooter className="sm:hidden">
            <Button
              variant="destructive"
              size="sm"
              disabled={isRevoking}
              onClick={handleRevokeClick}
              aria-label={`Revoke session from ${deviceDescription}`}
              aria-busy={isRevoking}
              className="w-full"
            >
              {isRevoking ? (
                <span
                  className="flex items-center justify-center gap-2"
                  aria-live="polite"
                >
                  <Spinner className="size-4" />
                  <span>Revoking…</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <TrashIcon className="size-4" />
                  <span>Revoke</span>
                </span>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke this session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately sign out{" "}
              <span className="font-medium">{deviceDescription}</span>. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              className={buttonVariants({ variant: "destructive" })}
            >
              Yes, revoke session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
