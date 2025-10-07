import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { sendMail } from "./lib/email"
import prismadb from "./lib/prismadb"
import "server-only"

export const auth = betterAuth({
  appName: "Template",
  database: prismaAdapter(prismadb, {
    provider: "postgresql",
  }),
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, token }) => {
      const url = `${process.env.BETTER_AUTH_URL}/reset-password?token=${token}`
      const html = `<p>Hi ${user.name},</p>
<p>Click the link below to reset your password.</p>
<a href="${url}">Reset password</a>`
      await sendMail(user.email, "Reset your password", html)
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, token }) => {
      const url = `${process.env.BETTER_AUTH_URL}/verify-email?token=${token}`
      const html = `<p>Hi ${user.name},</p>
<p>Click the link below to verify your email address.</p>
<a href="${url}">Verify email</a>`
      await sendMail(user.email, "Verify your email", html)
    },
    autoSignInAfterVerification: true,
    sendOnSignUp: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
})
