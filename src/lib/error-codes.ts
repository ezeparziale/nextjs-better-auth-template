export const ERROR_CODES = {
  ACCESS_DENIED: "access_denied",
  ACCESS_UNAUTHORIZED: "access_unauthorized",
  BANNED: "banned",
  CONFIRM_EMAIL: "confirm_email",
  TOKEN_EXPIRED: "token_expired",
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

const ERROR_PATH = "/error"

export function errorUrl(code: ErrorCode, description?: string) {
  const searchParams = new URLSearchParams({ error: code })

  if (description) {
    searchParams.set("error_description", description)
  }

  return `${ERROR_PATH}?${searchParams.toString()}`
}
