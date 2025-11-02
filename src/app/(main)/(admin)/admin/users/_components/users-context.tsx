"use client"

import { createContext, useContext, useState } from "react"

type UsersContextType = {
  refreshTrigger: number
  refreshUsers: () => void
}

const UsersContext = createContext<UsersContextType | undefined>(undefined)

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refreshUsers = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <UsersContext.Provider value={{ refreshTrigger, refreshUsers }}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsersContext() {
  const context = useContext(UsersContext)
  if (!context) {
    throw new Error("useUsersContext must be used within UsersProvider")
  }
  return context
}
