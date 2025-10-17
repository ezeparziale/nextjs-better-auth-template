import * as z from "zod"

export const enableTwoFactorAuthSchema = z.object({
  password: z.string().min(1, {
    message: "Password is required",
  }),
})

export const disableTwoFactorAuthSchema = z.object({
  password: z.string().min(1, {
    message: "Password is required",
  }),
  confirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm to disable 2FA",
  }),
})

export type EnableTwoFactorAuthForm = z.infer<typeof enableTwoFactorAuthSchema>
export type DisableTwoFactorAuthForm = z.infer<typeof disableTwoFactorAuthSchema>
