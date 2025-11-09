export const PERMISSIONS_EVENTS = {
  REFRESH: "permissions:refresh",
} as const

export type PermissionsRefreshDetail = {
  resetPagination?: boolean
}

export const emitPermissionsRefresh = (options?: PermissionsRefreshDetail) => {
  window.dispatchEvent(
    new CustomEvent(PERMISSIONS_EVENTS.REFRESH, {
      detail: options || { resetPagination: true },
    }),
  )
}
