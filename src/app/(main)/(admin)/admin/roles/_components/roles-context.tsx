"use client"

import { createContext, useContext, useState } from "react"

type RolesContextType = {
  refreshTrigger: number
  refreshRoles: () => void
}

const RolesContext = createContext<RolesContextType | undefined>(undefined)

export function RolesProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshRoles = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <RolesContext.Provider value={{ refreshTrigger, refreshRoles }}>
      {children}
    </RolesContext.Provider>
  )
}

export function useRolesContext() {
  const context = useContext(RolesContext)
  if (!context) {
    throw new Error("useRolesContext must be used within RolesProvider")
  }
  return context
}
