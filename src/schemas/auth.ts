import * as z from "zod"

export const signUpFormSchema = z
  .object({
    name: z.string().min(1, { message: "Name is required." }),
    email: z
      .email({ message: "Invalid email address." })
      .min(1, { message: "Email is required." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please complete the password confirmation." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type SignUpForm = z.infer<typeof signUpFormSchema>

export const logInFormSchema = z.object({
  email: z.email({ message: "Invalid email address." }).min(1, {
    message: "Email is required.",
  }),
  password: z.string().min(1, { message: "Password is required." }),
})

export type LogInForm = z.infer<typeof logInFormSchema>

export const forgotPasswordFormSchema = z.object({
  email: z.email({ message: "Invalid email address." }).min(1, {
    message: "Email is required.",
  }),
})

export type ForgotPasswordForm = z.infer<typeof forgotPasswordFormSchema>

export const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Please complete the password confirmation." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

export type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>

export const updatePasswordFormSchema = z
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

export type UpdatePasswordForm = z.infer<typeof updatePasswordFormSchema>
