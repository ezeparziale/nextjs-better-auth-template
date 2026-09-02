"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useState, type ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  isProfileTab,
  TAB_DEFINITIONS,
  TAB_PARAM,
  type ProfileTab,
} from "./profile-tabs-config"

export default function ProfileTabs({
  initialTab,
  children,
}: {
  initialTab: ProfileTab
  children: ReactNode
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    const param = searchParams.get(TAB_PARAM) ?? undefined
    return isProfileTab(param) ? param : initialTab
  })

  const handleTabChange = (value: string) => {
    if (!isProfileTab(value)) return

    setActiveTab(value)

    const params = new URLSearchParams(searchParams.toString())
    params.set(TAB_PARAM, value)
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`)
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
      {children}
    </Tabs>
  )
}
