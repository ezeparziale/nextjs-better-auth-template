import type { DBAdapter } from "better-auth"
import { mapWithConcurrency, runInTransaction } from "./utils"

export interface AssignBatchOptions {
  /** Adapter to run against. Used to detect transaction support. */
  adapter: DBAdapter
  /** Join model to write, e.g. `"userRole"` or `"rolePermission"`. */
  model: string
  /** Field of the join row that holds the fixed target id, e.g. `"roleId"`. */
  targetField: string
  /** Id of the fixed target every item is assigned to. */
  targetValue: string
  /** Field of the join row that holds the per-item id, e.g. `"userId"`. */
  itemField: string
  /**
   * Ids to assign. Must be deduplicated (see `normalizeIdBatch`) so the returned
   * counts add up to `itemIds.length`.
   */
  itemIds: readonly string[]
  /** Builds the row to insert for a single item id. */
  buildData: (itemId: string) => Record<string, string>
  /**
   * Maximum number of concurrent inserts. Statements issued inside a transaction
   * share a single connection, so this mainly bounds the load for adapters
   * without transaction support.
   * @default 10
   */
  concurrency?: number
}

export interface AssignBatchResult {
  /** Rows actually inserted. */
  assignedCount: number
  /** Items that were already assigned or lost a concurrent insert race. */
  skippedCount: number
}

const DEFAULT_CONCURRENCY = 10

/**
 * Assigns many items to a single target through a join model, without the
 * per-item read.
 *
 * Costs one batched read of the existing rows plus one insert per pending item,
 * instead of one read and one insert per item.
 *
 * Items that already exist are counted as skipped without touching the
 * database, and a failed insert is re-checked once before propagating, so a
 * concurrent writer that won the race is counted as skipped instead of
 * breaking the request. The unique constraint on the join table stays the
 * actual guard against duplicates.
 *
 * Runs in a transaction when the adapter supports it. Without transaction
 * support a mid-batch failure leaves the inserts that already happened.
 */
export async function assignBatch(
  options: AssignBatchOptions,
): Promise<AssignBatchResult> {
  const {
    adapter,
    model,
    targetField,
    targetValue,
    itemField,
    itemIds,
    buildData,
    concurrency = DEFAULT_CONCURRENCY,
  } = options

  if (itemIds.length === 0) {
    return { assignedCount: 0, skippedCount: 0 }
  }

  return runInTransaction(adapter, async (db) => {
    const existingRows = await db.findMany<Record<string, string>>({
      model,
      where: [
        { field: targetField, value: targetValue },
        { field: itemField, operator: "in", value: [...itemIds] },
      ],
      select: [itemField],
    })

    const alreadyAssigned = new Set(existingRows.map((row) => row[itemField] as string))
    const pendingIds = itemIds.filter((id) => !alreadyAssigned.has(id))

    if (pendingIds.length === 0) {
      return { assignedCount: 0, skippedCount: itemIds.length }
    }

    const created = await mapWithConcurrency(
      pendingIds,
      concurrency,
      async (itemId) => {
        try {
          await db.create({ model, data: buildData(itemId) })
          return true
        } catch (error) {
          const raced = await db.findOne<{ id: string }>({
            model,
            where: [
              { field: targetField, value: targetValue },
              { field: itemField, value: itemId },
            ],
          })

          if (!raced) throw error

          return false
        }
      },
    )

    const assignedCount = created.filter(Boolean).length

    return {
      assignedCount,
      skippedCount: alreadyAssigned.size + (created.length - assignedCount),
    }
  })
}
