export const USERS_EVENTS = {
  REFRESH: "users:refresh",
} as const

export type UsersRefreshDetail = {
  resetPagination?: boolean
}

export const emitUsersRefresh = (options?: UsersRefreshDetail) => {
  window.dispatchEvent(
    new CustomEvent(USERS_EVENTS.REFRESH, {
      detail: options || { resetPagination: true },
    }),
  )
}
