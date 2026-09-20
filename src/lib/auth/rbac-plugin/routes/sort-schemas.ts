import * as z from "zod"

const ROLE_FIELDS = [
  "id",
  "name",
  "key",
  "isActive",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
] as const

const PERMISSION_FIELDS = [
  "id",
  "name",
  "key",
  "isActive",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
] as const

const USER_FIELDS = ["id", "name", "email", "banned", "createdAt", "updatedAt"] as const

const sortSchema = <const T extends readonly string[]>(fields: T, subject: string) =>
  z
    .enum(fields)
    .meta({
      description: `The ${subject} field to sort by. Allowed: ${fields.join(", ")}.`,
    })
    .optional()

export const sortByRole = sortSchema(ROLE_FIELDS, "role")
export const sortByPermission = sortSchema(PERMISSION_FIELDS, "permission")
export const sortByUser = sortSchema(USER_FIELDS, "user")

export const sortDirection = z
  .enum(["asc", "desc"])
  .meta({
    description: "The direction to sort by. Defaults to asc.",
  })
  .optional()
