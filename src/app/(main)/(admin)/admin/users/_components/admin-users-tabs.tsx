"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  isAdminUsersTab,
  TAB_DEFINITIONS,
  TAB_PARAM,
  type AdminUsersTab,
} from "./admin-users-tabs-config"

// Query params owned by the users tab. Switched away from, they are removed
// so they don't leak into the invitations tab (and vice versa).
const USERS_TAB_PARAMS = [
  "search",
  "page",
  "pageSize",
  "sortBy",
  "sortDirection",
  "banned",
  "emailVerified",
  "role",
]

const INVITATIONS_TAB_PARAMS = ["invSearch", "invStatus"]

export default function AdminUsersTabs({
  usersContent,
  invitationsContent,
}: {
  usersContent: ReactNode
  invitationsContent: ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlTab = searchParams.get(TAB_PARAM)
  const activeTab: AdminUsersTab = isAdminUsersTab(urlTab ?? undefined)
    ? (urlTab as AdminUsersTab)
    : "users"

  const handleTabChange = (value: string) => {
    if (!isAdminUsersTab(value)) return

    const params = new URLSearchParams(searchParams.toString())
    params.set(TAB_PARAM, value)
    const staleParams = value === "users" ? INVITATIONS_TAB_PARAMS : USERS_TAB_PARAMS
    staleParams.forEach((key) => params.delete(key))
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, {
      scroll: false,
    })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        {TAB_DEFINITIONS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="users" className="mt-4">
        {usersContent}
      </TabsContent>
      <TabsContent value="invitations" className="mt-4">
        {invitationsContent}
      </TabsContent>
    </Tabs>
  )
}
