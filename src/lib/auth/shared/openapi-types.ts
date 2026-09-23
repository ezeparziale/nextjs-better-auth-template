import type { OpenAPIParameter } from "better-call"

/**
 * A single OpenAPI parameter. Extends better-call's `OpenAPIParameter` with
 * support for the `examples` field (OpenAPI 3.1), so multiple example values
 * can be provided and rendered by the docs UI (e.g. Scalar).
 */
export type OpenApiParameter = OpenAPIParameter & {
  examples?: Record<string, { value: string }>
}
