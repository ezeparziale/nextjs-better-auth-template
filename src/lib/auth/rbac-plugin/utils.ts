/**
 * Validates and applies pagination limits
 */
export function getPaginationParams(
  requestedLimit: number | string | undefined,
  requestedOffset: number | string | undefined,
  options: {
    defaultLimit: number
    maxLimit: number
    defaultOffset: number
  },
) {
  const limit = Math.min(
    Number(requestedLimit) || options.defaultLimit,
    options.maxLimit,
  )

  const offset = Number(requestedOffset) || options.defaultOffset

  return { limit, offset }
}
