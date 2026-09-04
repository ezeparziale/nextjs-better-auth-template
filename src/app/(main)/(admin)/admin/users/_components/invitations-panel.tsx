"use client"

import InvitationsTable from "./invitations-table"

export default function InvitationsPanel({
  initialParams,
}: {
  initialParams: Record<string, string | undefined>
}) {
  return (
    <div className="space-y-4">
      <InvitationsTable initialParams={initialParams} />
    </div>
  )
}
