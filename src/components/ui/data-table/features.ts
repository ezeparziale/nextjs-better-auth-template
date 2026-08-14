import {
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  createFacetedUniqueValues,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/react-table"

export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  columnVisibilityFeature,
  rowSelectionFeature,
  columnFilteringFeature,
  columnFacetingFeature,
  sortedRowModel: createSortedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
})

export type DataTableFeatures = typeof dataTableFeatures

export const dataTableOptions = {
  features: dataTableFeatures,
  manualPagination: true,
  manualSorting: true,
  autoResetPageIndex: false,
} as const
