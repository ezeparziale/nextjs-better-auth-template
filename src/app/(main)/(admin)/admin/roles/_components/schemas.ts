import * as z from "zod"

export const baseRoleSchema = z.object({
  name: z.string().min(1, "Name is required."),
  key: z.string().min(1, "Key is required."),
  description: z.string().min(1, "Description is required."),
  isActive: z.boolean(),
})

export const createRoleSchema = baseRoleSchema

export const editRoleSchema = baseRoleSchema
