"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { type SessionWithImpersonatedBy } from "better-auth/plugins/admin"
import { MonitorIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function UserSessionsList({
  sessions,
  userCurrentSession,
}: {
  sessions: SessionWithImpersonatedBy[]
  userCurrentSession: string
}) {
  const router = useRouter()
  const [isRevoking, setIsRevoking] = useState(false)
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null)
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false)
  const [sessionToRevoke, setSessionToRevoke] = useState<{
    token: string
    id: string
  } | null>(null)

  const handleRevokeAll = async () => {
    setIsRevoking(true)

    try {
      const { error } = await authClient.admin.revokeUserSessions({
        userId: sessions[0].userId,
      })

      if (error) {
        toast.error("Failed to revoke all sessions", {
          description: error.message || "An error occurred",
        })
      } else {
        toast.success("All sessions revoked successfully")
        setShowRevokeAllDialog(false)
        router.refresh()
      }
    } catch {
      toast.error("Failed to revoke all sessions", {
        description: "An unexpected error occurred",
      })
    } finally {
      setIsRevoking(false)
    }
  }

  const handleRevokeSession = async () => {
    if (!sessionToRevoke) return

    setRevokingSessionId(sessionToRevoke.id)
    try {
      const { error } = await authClient.admin.revokeUserSession({
        sessionToken: sessionToRevoke.token,
      })

      if (error) {
        toast.error("Failed to revoke session", {
          description: error.message || "An error occurred",
        })
      } else {
        toast.success("Session revoked successfully")
        router.refresh()
      }
    } catch {
      toast.error("Failed to revoke session", {
        description: "An unexpected error occurred",
      })
    } finally {
      setRevokingSessionId(null)
      setSessionToRevoke(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>
            Here is a list of all the sessions for this user.
          </CardDescription>
          <CardAction>
            <Button
              size="sm"
              onClick={() => setShowRevokeAllDialog(true)}
              disabled={isRevoking || sessions.length === 0}
              aria-label="Revoke all sessions"
            >
              Revoke all
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>User Agent</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 && (
                <Empty className="my-4 w-full border border-dashed">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <MonitorIcon />
                    </EmptyMedia>
                    <EmptyTitle>No sessions found</EmptyTitle>
                    <EmptyDescription>User has no sessions.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center justify-between gap-1">
                      {session.ipAddress}
                      {userCurrentSession === session.id && (
                        <Badge variant="blue-subtle">Current</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{session.userAgent}</TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">
                        {session.expiresAt.toLocaleDateString("es-ES")}
                      </span>
                      <span className="text-xs text-gray-500">
                        {session.expiresAt.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() =>
                        setSessionToRevoke({ token: session.token, id: session.id })
                      }
                      disabled={
                        revokingSessionId === session.id ||
                        userCurrentSession === session.id
                      }
                      aria-label="Revoke session"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to revoke all sessions?</DialogTitle>
            <DialogDescription>
              This action will immediately log out the user from all devices and
              locations. The user will need to sign in again to access their account.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={isRevoking}
                aria-label="Cancel revoke all sessions"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleRevokeAll}
              className={buttonVariants({ variant: "destructive" })}
              disabled={isRevoking}
              aria-label="Revoke all sessions"
            >
              {isRevoking && <Spinner />} Revoke all sessions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!sessionToRevoke}
        onOpenChange={(open) => !open && setSessionToRevoke(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to revoke this session?</DialogTitle>
            <DialogDescription>
              This will immediately log out the user from this specific device or
              location. If this is the user&apos;s current session, they will be signed
              out instantly. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                disabled={!!revokingSessionId || isRevoking}
                aria-label="Cancel revoke session"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleRevokeSession}
              className={buttonVariants({ variant: "destructive" })}
              disabled={!!revokingSessionId || isRevoking}
              aria-label="Revoke session"
            >
              {revokingSessionId && <Spinner />}
              Revoke session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
