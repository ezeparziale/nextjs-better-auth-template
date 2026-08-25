import * as z from "zod"
import {
  PERMISSION_KEY_ERROR_MESSAGE,
  PERMISSION_KEY_PATTERN,
} from "@/lib/auth/rbac-patterns"

export const basePermissionSchema = z.object({
  name: z.string().min(1, "Name is required."),
  key: z
    .string()
    .min(1, "Key is required.")
    .regex(PERMISSION_KEY_PATTERN, PERMISSION_KEY_ERROR_MESSAGE),
  description: z.string().min(1, "Description is required."),
  isActive: z.boolean(),
})

export const createPermissionSchema = basePermissionSchema

export const editPermissionSchema = basePermissionSchema
