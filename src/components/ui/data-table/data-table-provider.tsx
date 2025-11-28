"use client"

import { createContext, use, useState } from "react"

type DataTableContextType = {
  refreshKey: number
  refreshTable: (options?: { resetPagination?: boolean }) => void
  shouldResetPagination: number
}

const DataTableContext = createContext<DataTableContextType | undefined>(undefined)

export function DataTableProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0)
  const [shouldResetPagination, setShouldResetPagination] = useState(0)

  const refreshTable = (options?: { resetPagination?: boolean }) => {
    setRefreshKey((prev) => prev + 1)
    if (options?.resetPagination) {
      setShouldResetPagination((prev) => prev + 1)
    }
  }

  return (
    <DataTableContext value={{ refreshKey, refreshTable, shouldResetPagination }}>
      {children}
    </DataTableContext>
  )
}

export function useDataTable() {
  const context = use(DataTableContext)
  if (!context) {
    throw new Error("useDataTable must be used within DataTableProvider")
  }
  return context
}
