import type { Where } from "better-auth"
import * as z from "zod"

const DAY_MS = 86_400_000

/**
 * Filter param for boolean columns. Accepts a single value, a comma-separated
 * list (`?isActive=true,false`) or repeated params (`?isActive=true&isActive=false`).
 *
 * Zod coerces the accepted boolean strings (`true/1/yes/on`, `false/0/no/off`,
 * case-insensitive via `z.stringbool()`); anything else → 400.
 */
export const zBooleanFilter = z
  .preprocess(
    (value) =>
      Array.isArray(value)
        ? value
        : typeof value === "string"
          ? value
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : value,
    z.array(z.stringbool()).or(z.boolean()),
  )
  .optional()

/**
 * Filter param for a single day (`YYYY-MM-DD`, UTC semantics). Used for exact
 * day and range (`-From`/`-To`) date filters.
 */
export const zDayFilter = z
  .string()
  .refine(isValidDay, "Date must be a valid day in YYYY-MM-DD format.")
  .optional()

/**
 * Filter param for a raw multi-value list (e.g. `role=admin,user`).
 */
export const zListFilter = z
  .preprocess(
    (value) =>
      Array.isArray(value)
        ? value
        : typeof value === "string"
          ? value
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          : value,
    z.array(z.string()),
  )
  .optional()

export type FilterFieldConfig =
  | { field: string; kind: "bool" }
  | { field: string; kind: "list" }
  | { field: string; kind: "dateFrom" }
  | { field: string; kind: "dateTo" }
  | { field: string; kind: "day" }

/**
 * Builds a typed `Where[]` for list endpoints from validated filter query
 * params against a per-model whitelist. Conditions are ANDed together by the
 * adapter.
 *
 * - `bool`: scalar → `eq`; a mix of `true` and `false` is treated as "no
 *   filter" (it would match everything).
 * - `list`: scalar → `eq`; multiple values → `in`.
 * - `dateFrom`/`dateTo`: `YYYY-MM-DD` → `gte` (start of day) / `lt` (start of
 *   next day, exclusive upper bound).
 * - `day`: single `YYYY-MM-DD` → `[gte start, lt start+1day)`.
 */
export function buildFilterWhere(
  query: Record<string, unknown>,
  config: Record<string, FilterFieldConfig>,
): Where[] {
  const where: Where[] = []

  for (const [param, cfg] of Object.entries(config)) {
    const raw = query[param]
    if (raw === undefined || raw === null) continue

    if (cfg.kind === "bool") {
      const values = (Array.isArray(raw) ? raw : [raw]).filter(
        (v): v is boolean => typeof v === "boolean",
      )
      if (values.length === 0) continue
      const unique = [...new Set(values)]
      if (unique.length > 1) continue
      where.push({ field: cfg.field, value: unique[0] })
      continue
    }

    if (cfg.kind === "list") {
      const values = (Array.isArray(raw) ? raw : String(raw).split(","))
        .map((v) => String(v).trim())
        .filter(Boolean)
      if (values.length === 0) continue
      if (values.length === 1) {
        where.push({ field: cfg.field, value: values[0] })
      } else {
        where.push({ field: cfg.field, operator: "in", value: values })
      }
      continue
    }

    const startMs = toDayMs(String(raw))
    if (Number.isNaN(startMs)) continue

    if (cfg.kind === "dateFrom") {
      where.push({ field: cfg.field, operator: "gte", value: new Date(startMs) })
    } else if (cfg.kind === "dateTo") {
      where.push({
        field: cfg.field,
        operator: "lt",
        value: new Date(startMs + DAY_MS),
      })
    } else if (cfg.kind === "day") {
      where.push(
        { field: cfg.field, operator: "gte", value: new Date(startMs) },
        {
          field: cfg.field,
          operator: "lt",
          value: new Date(startMs + DAY_MS),
        },
      )
    }
  }

  return where
}

function toDayMs(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return Number.NaN
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return Number.NaN
  }
  return date.getTime()
}

function isValidDay(value: string): boolean {
  return !Number.isNaN(toDayMs(value))
}
