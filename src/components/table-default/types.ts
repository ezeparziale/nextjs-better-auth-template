import type { ColumnDef, RowData, SortingState } from "@tanstack/react-table"
import type { LucideIcon } from "lucide-react"
import type { DataTableFeatures } from "@/components/ui/data-table"

export type TableColumnDef<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData,
  unknown
>

export type TableRequest = {
  pageIndex: number
  pageSize: number
  sorting: SortingState
  search: string
  filters: Record<string, string[]>
}

export type TableResponse<TData extends RowData> = {
  rows: TData[]
  total: number
}

export type TableFetchFn<TData extends RowData> = (
  request: TableRequest,
) => Promise<TableResponse<TData>>

export type TableFilterOption = {
  label: string
  value: string
}

export type TableFilter = {
  columnId: string
  title: string
  options: TableFilterOption[]
  single?: boolean
}

export type TableEmptyState = {
  entityLabel: string
  icon: LucideIcon
}

export type TableDefaultInitialParams = {
  page?: string
  pageSize?: string
  search?: string
  sortBy?: string
  sortDirection?: "asc" | "desc"
  [key: string]: string | undefined
}

export const DEFAULT_RESERVED_PARAMS = [
  "page",
  "pageSize",
  "search",
  "sortBy",
  "sortDirection",
]
