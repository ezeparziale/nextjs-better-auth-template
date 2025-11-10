import { APIError } from "better-auth/api"

export interface KeyValidationOptions {
  minLength: number
  maxLength: number
  pattern: RegExp
  errorMessage?: string
}

export interface KeyValidationConfig {
  permission: KeyValidationOptions
  role: KeyValidationOptions
}

/**
 * Validates a key (permission or role) against defined rules.
 * @throws {APIError} if validation fails
 */
export function validateKey(
  type: "permission" | "role",
  key: string,
  options: KeyValidationConfig,
): string {
  const { minLength, maxLength, pattern, errorMessage } = options[type]

  if (typeof key !== "string") {
    throw new APIError("BAD_REQUEST", {
      code: `INVALID_${type.toUpperCase()}_KEY`,
      message: `${capitalize(type)} key must be a string`,
    })
  }

  const trimmedKey = key.trim()
  if (!trimmedKey) {
    throw new APIError("BAD_REQUEST", {
      code: `EMPTY_${type.toUpperCase()}_KEY`,
      message: `${capitalize(type)} key cannot be empty`,
    })
  }

  if (trimmedKey.length < minLength) {
    throw new APIError("BAD_REQUEST", {
      code: `INVALID_${type.toUpperCase()}_KEY_LENGTH`,
      message: `${capitalize(type)} key must be at least ${minLength} characters long`,
    })
  }

  if (trimmedKey.length > maxLength) {
    throw new APIError("BAD_REQUEST", {
      code: `INVALID_${type.toUpperCase()}_KEY_LENGTH`,
      message: `${capitalize(type)} key must not exceed ${maxLength} characters`,
    })
  }

  if (!pattern.test(trimmedKey)) {
    throw new APIError("BAD_REQUEST", {
      code: `INVALID_${type.toUpperCase()}_KEY_FORMAT`,
      message: errorMessage || defaultErrorMessage(type),
    })
  }

  return trimmedKey
}

// Helper for capitalization and default messages
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function defaultErrorMessage(type: "permission" | "role"): string {
  return type === "permission"
    ? `Permission key must follow the format "feature:action" (e.g., "user:read", "post:write").`
    : `Role key must contain only letters, numbers, or underscores (e.g., "admin", "editor").`
}
