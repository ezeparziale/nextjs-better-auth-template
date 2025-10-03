import { z } from "zod"

export const SignUpFormSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required." }),
    email: z
      .email({ message: "Invalid email address." })
      .min(1, { message: "Email is required." }),
    password: z.string().min(6, { message: "Password must be at least 6 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type SignUpFormSchemaType = z.infer<typeof SignUpFormSchema>

export const LogInFormSchema = z.object({
  email: z.email({ message: "Invalid email address." }),
  password: z.string(),
})

export type LogInFormSchemaType = z.infer<typeof LogInFormSchema>

export const ForgotPasswordFormSchema = z.object({
  email: z.email({ message: "Invalid email address." }),
})

export type ForgotPasswordFormSchemaType = z.infer<typeof ForgotPasswordFormSchema>

export const ResetPasswordFormSchema = z
  .object({
    password: z.string(),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type ResetPasswordFormSchemaType = z.infer<typeof ResetPasswordFormSchema>
