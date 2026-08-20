import type { Where } from "better-auth"
import { APIError } from "better-auth/api"

type FilterValue =
  string | number | boolean | string[] | number[] | boolean[] | undefined

/**
 * Parses a JSON string of filters (e.g. `[{"field":"isActive","operator":"eq","value":"true"}]`)
 * into Better Auth `Where[]` conditions.
 *
 * - Coerces `"true"` / `"false"` values to booleans.
 * - For the `in` operator, accepts arrays or comma-separated strings and coerces
 *   all-boolean lists; a mix of `true` and `false` is treated as "no filter".
 *
 * Throws an `APIError("BAD_REQUEST")` if the payload is malformed.
 */
export function parseFiltersParam(filtersJson: string): Where[] {
  const where: Where[] = []

  try {
    const filters = JSON.parse(filtersJson) as Where[]
    for (const filter of filters) {
      let filterValue = filter.value as FilterValue

      if (filter.operator === "in") {
        try {
          if (typeof filterValue === "string") {
            if (filterValue.startsWith("[")) {
              filterValue = JSON.parse(filterValue)
            } else {
              filterValue = filterValue.split(",").map((v) => v.trim())
            }
          }
        } catch {
          if (typeof filterValue === "string") {
            filterValue = filterValue.split(",").map((v) => v.trim())
          }
        }
        if (!Array.isArray(filterValue)) {
          throw new APIError("BAD_REQUEST", {
            message: "Value must be an array",
          })
        }
        const boolValues: boolean[] = []
        let isAllBooleans = true
        for (const v of filterValue) {
          if (v === "true" || v === true) {
            boolValues.push(true)
          } else if (v === "false" || v === false) {
            boolValues.push(false)
          } else {
            isAllBooleans = false
            break
          }
        }

        if (isAllBooleans) {
          if (boolValues.includes(true) && boolValues.includes(false)) {
            continue
          }
          filterValue = boolValues
        }
      } else if (filterValue === "true") {
        filterValue = true
      } else if (filterValue === "false") {
        filterValue = false
      }

      if (filterValue !== undefined) {
        where.push({
          field: filter.field,
          operator: filter.operator || "eq",
          value: filterValue as unknown as string[],
        })
      }
    }
  } catch {
    throw new APIError("BAD_REQUEST", {
      message: "Invalid filters format",
    })
  }

  return where
}
