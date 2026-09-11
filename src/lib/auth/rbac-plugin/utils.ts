/**
 * Validates and applies pagination limits.
 *
 * - `limit`: invalid (not a number), `0` or negative values fall back to `defaultLimit`;
 *   values above `maxLimit` are clamped to it.
 * - `offset`: invalid or negative values fall back to `defaultOffset`;
 *   values above `maxOffset` are clamped to it.
 */
export function getPaginationParams(
  requestedLimit: number | string | undefined,
  requestedOffset: number | string | undefined,
  options: {
    defaultLimit: number
    maxLimit: number
    defaultOffset: number
    maxOffset: number
  },
) {
  const parsedLimit = Number(requestedLimit)
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, options.maxLimit)
      : options.defaultLimit

  const parsedOffset = Number(requestedOffset)
  const offset =
    Number.isFinite(parsedOffset) && parsedOffset >= 0
      ? Math.min(parsedOffset, options.maxOffset)
      : options.defaultOffset

  return { limit, offset }
}

/**
 * Removes duplicate ids while preserving order
 */
export function dedupeIds(ids: string[]): string[] {
  return [...new Set(ids)]
}
