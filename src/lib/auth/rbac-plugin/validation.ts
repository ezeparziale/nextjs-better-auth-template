import { APIError } from "better-auth/api"
import { RBAC_ERROR_CODES } from "./error-codes"

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

const KEY_ERROR_CODES = {
  permission: {
    empty: RBAC_ERROR_CODES.EMPTY_PERMISSION_KEY,
    length: RBAC_ERROR_CODES.INVALID_PERMISSION_KEY_LENGTH,
    format: RBAC_ERROR_CODES.INVALID_PERMISSION_KEY_FORMAT,
  },
  role: {
    empty: RBAC_ERROR_CODES.EMPTY_ROLE_KEY,
    length: RBAC_ERROR_CODES.INVALID_ROLE_KEY_LENGTH,
    format: RBAC_ERROR_CODES.INVALID_ROLE_KEY_FORMAT,
  },
} as const

type KeyErrorCode =
  (typeof KEY_ERROR_CODES)[keyof typeof KEY_ERROR_CODES][keyof (typeof KEY_ERROR_CODES)[keyof typeof KEY_ERROR_CODES]]

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
  const codes = KEY_ERROR_CODES[type]
  const trimmedKey = key.trim()

  if (!trimmedKey) {
    throw keyError(codes.empty)
  }

  if (trimmedKey.length < minLength || trimmedKey.length > maxLength) {
    const message =
      trimmedKey.length < minLength
        ? `${capitalize(type)} key must be at least ${minLength} characters long`
        : `${capitalize(type)} key must not exceed ${maxLength} characters`
    throw keyError(codes.length, message)
  }

  if (!pattern.test(trimmedKey)) {
    throw keyError(codes.format, errorMessage)
  }

  return trimmedKey
}

function keyError(codeObject: KeyErrorCode, message?: string): never {
  throw new APIError("BAD_REQUEST", {
    code: codeObject.code,
    message: message ?? codeObject.message,
  })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
