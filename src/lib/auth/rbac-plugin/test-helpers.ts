import type { DBAdapter, DBTransactionAdapter } from "better-auth"
import type { RbacAdapter } from "./utils"

/**
 * In-memory double for `RbacAdapter` / `DBAdapter` used by the plugin tests.
 *
 * Faithful enough to assert the behaviour the write paths depend on:
 * - every method records the call, so tests can count queries per model;
 * - `transaction` snapshots the rows and restores them when the callback
 *   throws, so a test can actually observe a rollback. A double that mutated
 *   rows eagerly would make "did it roll back?" untestable.
 *
 * Kept dialect-agnostic on purpose: it never emulates Postgres-only behaviour
 * (no aborted-transaction state after a caught error, no error on `in: []`),
 * because the plugin has to behave the same on Postgres, MySQL and SQLite.
 */

export type FakeRow = Record<string, unknown>

export type FakeCallMethod =
  "findOne" | "findMany" | "create" | "update" | "delete" | "deleteMany"

export interface FakeCall {
  method: FakeCallMethod
  model: string
}

interface WhereClause {
  field: string
  operator?: string
  value?: unknown
}

export interface FakeAdapterOptions {
  rows?: FakeRow[]
  /** Makes a `create` fail for the given row, to simulate a unique violation. */
  failOn?: (row: FakeRow) => boolean
  /**
   * Whether the adapter exposes a transaction. Defaults to `"supported"`, so
   * a test that forgets to set it exercises the atomic path like a real adapter
   * would. Pass `"unsupported"` to cover the non-atomic fallback.
   */
  transaction?: "supported" | "unsupported"
}

function matches(row: FakeRow, where?: WhereClause[]): boolean {
  if (!where) return true

  return where.every((clause) => {
    const value = row[clause.field]

    if (clause.operator === "in") {
      return Array.isArray(clause.value) && clause.value.includes(value)
    }

    if (clause.operator === "contains") {
      return String(value ?? "").includes(String(clause.value ?? ""))
    }

    return value === clause.value
  })
}

function pick(row: FakeRow, select?: string[]): FakeRow {
  if (!select) return row

  return Object.fromEntries(select.map((field) => [field, row[field]]))
}

/**
 * Flattens a `model -> rows` map into the flat `__model`-tagged list the fake
 * stores, so a test can declare its fixture as tables.
 */
export function fromTables(tables: Record<string, FakeRow[]>): FakeRow[] {
  return Object.entries(tables).flatMap(([model, modelRows]) =>
    modelRows.map((row) => ({ ...row, __model: model })),
  )
}

export function createFakeAdapter(options: FakeAdapterOptions = {}) {
  const rows: FakeRow[] = (options.rows ?? []).map((row) => ({ ...row }))
  const calls: FakeCall[] = []
  const snapshots: FakeRow[][] = []
  let openTransactions = 0
  let commits = 0
  let rollbacks = 0
  let nextId = 1
  let maxParallelCreates = 0
  let parallelCreates = 0

  const track = (method: FakeCallMethod, model: string) => {
    calls.push({ method, model })
  }

  const selected = (model: string, where?: WhereClause[]): FakeRow[] =>
    rows.filter((row) => row.__model === model && matches(row, where))

  const handle = {
    findOne: async <T>({
      model,
      where,
    }: {
      model: string
      where?: WhereClause[]
    }): Promise<T | null> => {
      track("findOne", model)

      const row = selected(model, where)[0]

      return row ? ({ ...row } as T) : null
    },
    findMany: async <T>({
      model,
      where,
      limit,
      offset,
      sortBy,
      select,
    }: {
      model: string
      where?: WhereClause[]
      limit?: number
      offset?: number
      sortBy?: { field: string; direction: "asc" | "desc" }
      select?: string[]
    }): Promise<T[]> => {
      track("findMany", model)

      let found = selected(model, where)

      if (sortBy) {
        const direction = sortBy.direction === "desc" ? -1 : 1
        found = [...found].sort((a, b) => {
          const left = a[sortBy.field]
          const right = b[sortBy.field]

          if (left === right) return 0

          return (left! > right! ? 1 : -1) * direction
        })
      }

      const start = offset ?? 0
      const end = limit === undefined ? undefined : start + limit

      return found.slice(start, end).map((row) => pick(row, select) as T)
    },
    create: async <T extends Record<string, unknown>, R = T>({
      model,
      data,
      select,
    }: {
      model: string
      data: T
      select?: string[]
    }): Promise<R> => {
      track("create", model)
      parallelCreates += 1
      maxParallelCreates = Math.max(maxParallelCreates, parallelCreates)
      await Promise.resolve()

      const row: FakeRow = { id: `id_${nextId++}`, ...data, __model: model }

      if (options.failOn?.(row)) {
        parallelCreates -= 1
        throw new Error("unique constraint")
      }

      rows.push(row)
      parallelCreates -= 1

      return pick(row, select) as R
    },
    update: async <T>({
      model,
      where,
      update,
    }: {
      model: string
      where: WhereClause[]
      update: Record<string, unknown>
    }): Promise<T | null> => {
      track("update", model)

      const row = selected(model, where)[0]

      if (!row) return null

      const index = rows.indexOf(row)
      const updated = { ...row, ...update }
      rows[index] = updated

      return { ...updated } as T
    },
    delete: async ({
      model,
      where,
    }: {
      model: string
      where: WhereClause[]
    }): Promise<void> => {
      track("delete", model)

      const row = selected(model, where)[0]

      if (!row) return

      rows.splice(rows.indexOf(row), 1)
    },
    deleteMany: async ({
      model,
      where,
    }: {
      model: string
      where: WhereClause[]
    }): Promise<number> => {
      track("deleteMany", model)

      const doomed = new Set(selected(model, where))

      let deleted = 0

      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (!doomed.has(rows[index])) continue

        rows.splice(index, 1)
        deleted += 1
      }

      return deleted
    },
  } satisfies RbacAdapter

  const base: Record<string, unknown> =
    (options.transaction ?? "supported") === "supported"
      ? {
          ...handle,
          transaction: async function <R>(
            this: unknown,
            callback: (db: DBTransactionAdapter) => Promise<R>,
          ): Promise<R> {
            const snapshot = rows.map((row) => ({ ...row }))
            snapshots.push(snapshot)
            openTransactions += 1

            // Hand the callback the object `transaction` was invoked on, so a
            // test that wraps a single method (for instance to simulate a
            // concurrent writer) keeps that wrapper in effect inside the
            // transaction. Falling back to the inner handle when it is called
            // detached.
            const db = (this as DBAdapter | undefined) ?? (base as unknown as DBAdapter)

            try {
              const result = await callback(db as unknown as DBTransactionAdapter)
              commits += 1

              return result
            } catch (error) {
              rows.length = 0
              rows.push(...snapshot)
              rollbacks += 1

              throw error
            } finally {
              snapshots.pop()
              openTransactions -= 1
            }
          },
        }
      : { ...handle, transaction: false }

  const withTransaction = base as unknown as DBAdapter

  return {
    adapter: withTransaction,
    rows,
    calls,
    rowsOf: (model: string) => rows.filter((row) => row.__model === model),
    /**
     * Counters are methods, not getters: destructuring a getter would snapshot
     * it before the code under test ran.
     */
    openTransactions: () => openTransactions,
    commits: () => commits,
    rollbacks: () => rollbacks,
    maxParallelCreates: () => maxParallelCreates,
    /** Calls as `"method:model"` strings, for order-sensitive assertions. */
    callLog: () => calls.map((call) => `${call.method}:${call.model}`),
    countOf: (method: FakeCallMethod, model?: string) =>
      calls.filter(
        (call) =>
          call.method === method && (model === undefined || call.model === model),
      ).length,
  }
}

export type FakeAdapter = ReturnType<typeof createFakeAdapter>
