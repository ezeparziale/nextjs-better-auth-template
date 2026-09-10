"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ColumnFiltersState,
  ColumnVisibilityState,
  RowData,
  RowSelectionState,
  SortingState,
  useTable,
} from "@tanstack/react-table"
import {
  createSelectColumn,
  dataTableOptions,
  useDataTable,
} from "@/components/ui/data-table"
import {
  DEFAULT_RESERVED_PARAMS,
  TableColumnDef,
  TableDefaultInitialParams,
  TableFetchFn,
} from "./types"

export interface UseServerDataTableOptions<TData extends RowData> {
  columns: TableColumnDef<TData>[]
  fetchData: TableFetchFn<TData>
  getRowId: (row: TData) => string
  initialParams: TableDefaultInitialParams

  enableSelection?: boolean

  defaultColumnVisibility?: ColumnVisibilityState
  defaultSorting?: SortingState
  sortableColumns?: string[]

  reservedParams?: string[]
  defaultPageSize?: number

  searchParam?: string
  filterParamMap?: Record<string, string>
}

const DEFAULT_SORTING: SortingState = [{ id: "updatedAt", desc: true }]
const DEFAULT_VISIBILITY: ColumnVisibilityState = {}
const DEFAULT_RESERVED: string[] = []

export function useServerDataTable<TData extends RowData>({
  columns,
  fetchData,
  getRowId,
  initialParams,
  enableSelection = false,
  defaultColumnVisibility = DEFAULT_VISIBILITY,
  defaultSorting = DEFAULT_SORTING,
  sortableColumns,
  reservedParams = DEFAULT_RESERVED,
  defaultPageSize = 10,
  searchParam = "search",
  filterParamMap = {},
}: UseServerDataTableOptions<TData>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString()

  const [data, setData] = useState<TData[]>([])
  const [loading, setLoading] = useState(true)

  const ignoredParams = useMemo(
    () => [...DEFAULT_RESERVED_PARAMS, ...reservedParams],
    [reservedParams],
  )

  const [searchInput, setSearchInput] = useState(initialParams[searchParam] || "")
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    Object.entries(initialParams).forEach(([key, value]) => {
      const columnId = filterParamMap[key] ?? key
      if (
        !ignoredParams.includes(key) &&
        !ignoredParams.includes(columnId) &&
        key !== searchParam &&
        value
      ) {
        filters.push({
          id: columnId,
          value: value.split(","),
        })
      }
    })
    return filters
  })
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (
      initialParams.sortBy &&
      (!sortableColumns || sortableColumns.includes(initialParams.sortBy))
    ) {
      return [
        {
          id: initialParams.sortBy,
          desc: initialParams.sortDirection === "desc",
        },
      ]
    }
    return defaultSorting
  })
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>(
    defaultColumnVisibility,
  )
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [pagination, setPagination] = useState(() => {
    const page = initialParams.page ? parseInt(initialParams.page, 10) : 0
    const pageSize = initialParams.pageSize
      ? parseInt(initialParams.pageSize, 10)
      : defaultPageSize
    return {
      pageIndex: Number.isFinite(page) && page > 0 ? page - 1 : 0,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : defaultPageSize,
    }
  })
  const [total, setTotal] = useState(0)

  const isFirstRun = useRef(true)

  const handleClearSearch = () => {
    setSearchInput("")
  }

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const { refreshKey, shouldResetPagination } = useDataTable()
  const [prevShouldReset, setPrevShouldReset] = useState(shouldResetPagination)

  if (shouldResetPagination !== prevShouldReset) {
    setPrevShouldReset(shouldResetPagination)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const filtersRecord: Record<string, string[]> = {}
        columnFilters.forEach((filter) => {
          const value = filter.value as string[]
          if (value.length > 0) filtersRecord[filter.id] = value
        })

        const response = await fetchData({
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          sorting,
          search: searchInput.trim(),
          filters: filtersRecord,
        })
        if (cancelled) return
        setData(response.rows)
        setTotal(response.total)
      } catch (err) {
        console.error("Error:", err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    searchInput,
    sorting,
    refreshKey,
    columnFilters,
    fetchData,
  ])

  const filterParamByColumnId = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(filterParamMap).map(([param, columnId]) => [columnId, param]),
      ),
    [filterParamMap],
  )

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }

    const params = new URLSearchParams(searchParamsString)
    DEFAULT_RESERVED_PARAMS.forEach((key) => params.delete(key))

    if (searchInput) {
      params.set(searchParam, searchInput)
    } else {
      params.delete(searchParam)
    }

    columnFilters.forEach((filter) => {
      const paramName = filterParamByColumnId[filter.id] ?? filter.id
      params.delete(paramName)
      if (Array.isArray(filter.value) && filter.value.length > 0) {
        params.set(paramName, filter.value.join(","))
      }
    })

    if (pagination.pageIndex > 0) {
      params.set("page", String(pagination.pageIndex + 1))
    }
    if (pagination.pageSize !== defaultPageSize) {
      params.set("pageSize", String(pagination.pageSize))
    }

    const isDefaultSort =
      sorting.length === defaultSorting.length &&
      sorting.every(
        (s, i) => s.id === defaultSorting[i].id && s.desc === defaultSorting[i].desc,
      )

    if (sorting.length > 0 && !isDefaultSort) {
      params.set("sortBy", sorting[0].id)
      params.set("sortDirection", sorting[0].desc ? "desc" : "asc")
    }

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`

    const currentUrl = `${pathname}${searchParamsString ? `?${searchParamsString}` : ""}`
    if (newUrl !== currentUrl) {
      router.push(newUrl, { scroll: false })
    }
  }, [
    searchInput,
    columnFilters,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    pathname,
    router,
    searchParamsString,
    defaultPageSize,
    defaultSorting,
    reservedParams,
    searchParam,
    filterParamByColumnId,
  ])

  const tableColumns = useMemo(() => {
    if (!enableSelection) return columns
    return [createSelectColumn<TData>(), ...columns]
  }, [columns, enableSelection])

  const table = useTable({
    ...dataTableOptions,
    data,
    columns: tableColumns,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: {
      pagination,
      sorting,
      columnVisibility,
      columnFilters,
      ...(enableSelection ? { rowSelection } : {}),
    },
    ...(enableSelection
      ? {
          onRowSelectionChange: setRowSelection,
          enableMultiRowSelection: true,
        }
      : {}),
    onPaginationChange: (updater) => {
      setPagination(updater)
      setRowSelection({})
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    manualFiltering: true,
    getRowId,
  })

  return {
    table,
    loading,
    data,
    total,
    searchInput,
    handleClearSearch,
    handleSearchChange,
  }
}

export type UseServerDataTableResult<TData extends RowData> = ReturnType<
  typeof useServerDataTable<TData>
>
