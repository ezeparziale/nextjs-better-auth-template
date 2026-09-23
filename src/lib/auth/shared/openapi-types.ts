import type { OpenAPIParameter } from "better-call"

export interface OpenAPIExample {
  summary?: string
  description?: string
  value?: unknown
  externalValue?: string
}

export interface OpenAPIRef {
  $ref: string
  summary?: string
  description?: string
}

/**
 * A single OpenAPI parameter. Extends better-call's `OpenAPIParameter` with
 * support for the `examples` field (OpenAPI 3.1), so multiple example values
 * can be provided and rendered by the docs UI (e.g. Scalar).
 */
export type OpenApiParameter = OpenAPIParameter & {
  /**
   * Multiple examples keyed by name at the parameter level (OpenAPI 3.0 / 3.1)
   */
  examples?: Record<string, OpenAPIExample | OpenAPIRef>
}
