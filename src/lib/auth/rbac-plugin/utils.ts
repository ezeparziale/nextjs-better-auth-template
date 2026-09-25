import type { DBAdapter, Where } from "better-auth"
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
 * Minimal adapter surface used by the RBAC helpers.
 *
 * Declared structurally (instead of reusing better-auth's `DBAdapter`) so the
 * same helpers accept a regular adapter, a transaction handle, or a test double,
 * and so they only depend on the methods they actually use.
 */
export interface RbacAdapter {
  findOne<T>(data: { model: string; where?: Where[] | undefined }): Promise<T | null>
  findMany<T>(data: {
    model: string
    where?: Where[] | undefined
    limit?: number | undefined
    offset?: number | undefined
    select?: string[] | undefined
    sortBy?: { field: string; direction: "asc" | "desc" } | undefined
  }): Promise<T[]>
  create<T extends Record<string, unknown>, R = T>(data: {
    model: string
    data: T
    select?: string[] | undefined
  }): Promise<R>
}

/**
 * Runs `fn` inside a transaction when the adapter supports one, falling back to
 * running it directly against the adapter otherwise. Adapters without
 * transaction support (standalone MongoDB, in-memory, ...) set
 * `transaction: false` or omit it.
 *
 * Callers must be aware that the fallback is not atomic: a mid-way failure
 * leaves the writes that already happened in place.
 */
export async function runInTransaction<T>(
  adapter: DBAdapter,
  fn: (db: RbacAdapter) => Promise<T>,
): Promise<T> {
  if (typeof adapter.transaction !== "function") {
    return fn(adapter)
  }

  return adapter.transaction(fn)
}

/**
 * Maps `items` through `mapper` with at most `limit` concurrent calls, keeping
 * the result order. On the first rejection no new tasks are started and the
 * original error is rethrown once the in-flight tasks settle.
 *
 * A non-positive or non-finite `limit` falls back to sequential execution.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  if (items.length === 0) return results

  const safeLimit = Number.isFinite(limit) ? Math.floor(limit) : 1
  const workerCount = Math.max(1, Math.min(safeLimit, items.length))
  let cursor = 0
  let failed = false
  let failure: unknown

  const worker = async (): Promise<void> => {
    while (!failed) {
      const index = cursor
      cursor += 1

      if (index >= items.length) return

      try {
        results[index] = await mapper(items[index], index)
      } catch (error) {
        if (!failed) {
          failed = true
          failure = error
        }
        return
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  if (failed) throw failure

  return results
}

/**
 * Returns the ids from `ids` that do not exist in the given model,
 * preserving input order. Uses a single batched query instead of one
 * `findOne` per id.
 */
export async function findMissingIds(
  adapter: Pick<RbacAdapter, "findMany">,
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
