import * as z from "zod"
import { ROLE_KEY_ERROR_MESSAGE, ROLE_KEY_PATTERN } from "@/lib/auth/rbac-patterns"

export const baseRoleSchema = z.object({
  name: z.string().min(1, "Name is required."),
  key: z
    .string()
    .min(1, "Key is required.")
    .regex(ROLE_KEY_PATTERN, ROLE_KEY_ERROR_MESSAGE),
  description: z.string().min(1, "Description is required."),
  isActive: z.boolean(),
})

export const createRoleSchema = baseRoleSchema

export const editRoleSchema = baseRoleSchema
