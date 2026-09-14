import type { Where } from "better-auth"
import { APIError } from "better-auth/api"
import { RBAC_ERROR_CODES } from "./error-codes"
import type { RBACPluginOptions } from "./types"

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

/**
 * Deduplicates an array of ids and enforces the batch size cap
 * (`maxBatchAssignmentSize`, default 500). Duplicates are removed before the
 * cap is checked, so `["a", "a", "a"]` counts as 1.
 *
 * Throws `BAD_REQUEST` + `BATCH_TOO_LARGE` when the deduplicated list exceeds
 * the cap.
 */
export function normalizeIdBatch(
  ids: string[],
  options: Pick<RBACPluginOptions, "maxBatchAssignmentSize">,
  label: string,
): string[] {
  const unique = dedupeIds(ids)
  const maxSize = options.maxBatchAssignmentSize ?? 500

  if (unique.length > maxSize) {
    throw new APIError("BAD_REQUEST", {
      code: RBAC_ERROR_CODES.BATCH_TOO_LARGE.code,
      message: RBAC_ERROR_CODES.BATCH_TOO_LARGE.message,
      details: {
        ids: label,
        provided: unique.length,
        maxBatchAssignmentSize: maxSize,
      },
    })
  }

  return unique
}

/**
 * Returns the ids from `ids` that do not exist in the given model,
 * preserving input order. Uses a single batched query instead of one
 * `findOne` per id.
 */
export async function findMissingIds(
  adapter: {
    findMany: <T>(data: {
      model: string
      where?: Where[] | undefined
      limit?: number | undefined
      offset?: number | undefined
      select?: string[] | undefined
      sortBy?: { field: string; direction: "asc" | "desc" } | undefined
    }) => Promise<T[]>
  },
  model: string,
  ids: string[],
): Promise<string[]> {
  if (ids.length === 0) return []

  const found = await adapter.findMany<{ id: string }>({
    model,
    where: [{ field: "id", operator: "in", value: ids }],
  })

  const foundIds = new Set(found.map((item) => item.id))

  return ids.filter((id) => !foundIds.has(id))
}
