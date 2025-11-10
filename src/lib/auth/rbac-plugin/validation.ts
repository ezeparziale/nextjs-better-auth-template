import { APIError } from "better-auth/api"

export interface PermissionKeyValidationOptions {
  minLength: number
  maxLength: number
  pattern: RegExp
  errorMessage?: string
}

/**
 * Validates a permission key against defined rules
 * @throws {APIError} if validation fails
 */
export function validatePermissionKey(
  key: string,
  options: PermissionKeyValidationOptions,
): void {
  const { minLength, maxLength, pattern, errorMessage } = options

  // Check if key exists
  if (!key || typeof key !== "string") {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_PERMISSION_KEY",
      message: "Permission key is required and must be a string",
    })
  }

  // Trim whitespace
  const trimmedKey = key.trim()

  // Check minimum length
  if (trimmedKey.length < minLength) {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_PERMISSION_KEY_LENGTH",
      message: `Permission key must be at least ${minLength} characters long`,
    })
  }

  // Check maximum length
  if (trimmedKey.length > maxLength) {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_PERMISSION_KEY_LENGTH",
      message: `Permission key must not exceed ${maxLength} characters`,
    })
  }

  // Check pattern
  if (!pattern.test(trimmedKey)) {
    throw new APIError("BAD_REQUEST", {
      code: "INVALID_PERMISSION_KEY_FORMAT",
      message:
        errorMessage ||
        `Permission key must follow the format "feature:action" (e.g., "user:read", "post:write")`,
    })
  }
}
