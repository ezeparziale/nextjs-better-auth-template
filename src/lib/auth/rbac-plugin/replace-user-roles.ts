import type { DBAdapter } from "better-auth"
import type { UserRole, UserRoleCreateInput } from "./types"
import {
  dedupeIds,
  DEFAULT_WRITE_CONCURRENCY,
  mapWithConcurrency,
  runInTransaction,
} from "./utils"

export interface ReplaceUserRolesOptions {
  /** Adapter to run against. Used to detect transaction support. */
  adapter: DBAdapter
  /** User whose role set is being replaced. */
  userId: string
  /**
   * Target role ids. Deduplicated defensively, so the returned counts add up
   * even when a caller skips `normalizeIdBatch`.
   */
  roleIds: readonly string[]
  /** Cap for concurrent write statements. */
  concurrency?: number
}

export interface ReplaceUserRolesResult {
  /** Roles that were assigned to the user by this call. */
  addedCount: number
  /** Roles that were unassigned from the user by this call. */
  removedCount: number
  /** Roles the user already had and that were left untouched. */
  keptCount: number
}

/**
 * Replaces the whole role set of a single user.
 *
 * The current set is read inside the transaction so the diff is computed
 * against the same snapshot as the writes, and the removals plus the additions
 * are applied atomically: a failure part-way through leaves the user with
 * exactly the roles they had before the call, instead of a half-applied diff.
 *
 * Returns the counts of added, removed and kept roles, which add up to
 * `roleIds.length + removedCount`.
 *
 * Runs in a transaction when the adapter supports it. Without transaction
 * support a mid-batch failure leaves the writes that already happened.
 */
export async function replaceUserRoles(
  options: ReplaceUserRolesOptions,
): Promise<ReplaceUserRolesResult> {
  const { adapter, userId, concurrency = DEFAULT_WRITE_CONCURRENCY } = options

  // The counts are part of the endpoint response, so a caller that skipped
  // `normalizeIdBatch` must not be able to make them add up to more than the
  // real number of assignments.
  const roleIds = dedupeIds([...options.roleIds])

  return runInTransaction(adapter, async (db) => {
    const currentUserRoles = await db.findMany<UserRole>({
      model: "userRole",
      where: [{ field: "userId", value: userId }],
    })

    const currentRoleIds = new Set(currentUserRoles.map((ur) => ur.roleId))
    const newRoleIds = new Set(roleIds)

    // Roles to remove (in current but not in the target set)
    const toDelete = currentUserRoles.filter((ur) => !newRoleIds.has(ur.roleId))

    // Roles to add (in the target set but not in current)
    const toAdd = roleIds.filter((roleId) => !currentRoleIds.has(roleId))

    // Roles left untouched (in both)
    const kept = roleIds.filter((roleId) => currentRoleIds.has(roleId))

    // Unassign the removed roles in a single statement
    if (toDelete.length > 0) {
      await db.deleteMany({
        model: "userRole",
        where: [
          {
            field: "id",
            operator: "in",
            value: toDelete.map((ur) => ur.id),
          },
        ],
      })
    }

    // Assign the new roles, bounded so a large batch does not open one
    // connection per row
    if (toAdd.length > 0) {
      await mapWithConcurrency(toAdd, concurrency, (roleId) =>
        db.create<UserRoleCreateInput, UserRole>({
          model: "userRole",
          data: {
            userId,
            roleId,
          },
        }),
      )
    }

    return {
      addedCount: toAdd.length,
      removedCount: toDelete.length,
      keptCount: kept.length,
    }
  })
}
