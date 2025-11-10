import * as z from "zod"

export const basePermissionSchema = z.object({
  name: z.string().min(1, "Name is required."),
  key: z.string().min(1, "Key is required."),
  description: z.string().min(1, "Description is required."),
  isActive: z.boolean(),
})

export const createPermissionSchema = basePermissionSchema

export const editPermissionSchema = basePermissionSchema
