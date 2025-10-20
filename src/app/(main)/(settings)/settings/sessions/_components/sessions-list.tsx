"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Session } from "better-auth"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { SessionCard } from "./session-card"

interface SessionsListProps {
  currentSessionToken: string
  sessions: Session[]
}

export function SessionsList({ currentSessionToken, sessions }: SessionsListProps) {
  const router = useRouter()
  const [revokingToken, setRevokingToken] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [currentSession, otherSessions] = sessions.reduce<
    [Session | undefined, Session[]]
  >(
    ([current, others], session) =>
      session.token === currentSessionToken
        ? [session, others]
        : [current, [...others, session]],
    [undefined, []],
  )

  async function handleRevokeSession(token: string) {
    setRevokingToken(token)
    startTransition(async () => {
      try {
        await authClient.revokeSession({ token })
        toast.success("Session revoked successfully")
        router.refresh()
      } catch {
        toast.error("Failed to revoke session. Please try again.")
      } finally {
        setRevokingToken(null)
      }
    })
  }

  async function handleRevokeAll() {
    startTransition(async () => {
      try {
        await authClient.revokeOtherSessions()
        toast.success("All other sessions revoked")
        router.refresh()
      } catch {
        toast.error("Failed to revoke all sessions")
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current session</CardTitle>
          <CardDescription>Your active session on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          {currentSession ? (
            <SessionCard session={currentSession} isCurrent />
          ) : (
            <p className="text-muted-foreground text-sm">No active session found.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle>Other sessions</CardTitle>
              {otherSessions.length > 0 && (
                <Badge variant="secondary">{otherSessions.length}</Badge>
              )}
            </div>
            <CardDescription>Manage your logged-in devices.</CardDescription>
          </div>

          {otherSessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  aria-busy={isPending}
                >
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="size-4" />
                      <span>Revoking…</span>
                    </span>
                  ) : (
                    <span>Revoke all</span>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke all other sessions?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will log you out from all other devices except your current
                    session. You can log in again at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleRevokeAll}
                    className={buttonVariants({ variant: "destructive" })}
                  >
                    Revoke all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {otherSessions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No other active sessions.</p>
          ) : (
            otherSessions.map((session) => (
              <SessionCard
                key={session.token}
                session={session}
                onRevoke={handleRevokeSession}
                isRevoking={revokingToken === session.token}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
