"use client"

import { createContext, useContext, useState } from "react"

type PermissionsContextType = {
  refreshTrigger: number
  refreshPermissions: () => void
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshPermissions = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <PermissionsContext.Provider value={{ refreshTrigger, refreshPermissions }}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext)
  if (!context) {
    throw new Error("usePermissionsContext must be used within PermissionsProvider")
  }
  return context
}
