import { z } from "zod"

export const SignUpFormSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required." }),
    email: z
      .email({ message: "Invalid email address." })
      .min(1, { message: "Email is required." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type SignUpForm = z.infer<typeof SignUpFormSchema>

export const LogInFormSchema = z.object({
  email: z.email({ message: "Invalid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
})

export type LogInForm = z.infer<typeof LogInFormSchema>

export const ForgotPasswordFormSchema = z.object({
  email: z.email({ message: "Invalid email address." }),
})

export type ForgotPasswordForm = z.infer<typeof ForgotPasswordFormSchema>

export const ResetPasswordFormSchema = z
  .object({
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type ResetPasswordForm = z.infer<typeof ResetPasswordFormSchema>

export const UpdatePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Password is required." }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please complete the password confirmation." }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type UpdatePasswordForm = z.infer<typeof UpdatePasswordFormSchema>
