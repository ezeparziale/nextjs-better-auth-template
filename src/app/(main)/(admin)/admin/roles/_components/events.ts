export const ROLES_EVENTS = {
  REFRESH: "roles:refresh",
} as const

export type RolesRefreshDetail = {
  resetPagination?: boolean
}

export const emitRolesRefresh = (options?: RolesRefreshDetail) => {
  window.dispatchEvent(
    new CustomEvent(ROLES_EVENTS.REFRESH, {
      detail: options || { resetPagination: true },
    }),
  )
}
