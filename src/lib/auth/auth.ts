import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { admin, lastLoginMethod, twoFactor } from "better-auth/plugins"
import { passkey } from "better-auth/plugins/passkey"
import { sendMail } from "../email"
import prismadb from "../prismadb"
import { adminPlusPlugin } from "./admin-plus-plugin"
import { rbacPlugin } from "./rbac-plugin"

// import "server-only"

export const SUPPORTED_OAUTH_PROVIDERS = ["credential", "google", "github"] as const
export type SupportedOAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number]

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
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["credential", "google", "github"],
      allowDifferentEmails: false,
      updateUserInfoOnLink: false,
    },
  },
  plugins: [
    admin(),
    twoFactor(),
    passkey(),
    lastLoginMethod({
      storeInDatabase: true,
    }),
    rbacPlugin({
      minPermissionKeyLength: 5,
      permissionKeyPattern: /^[a-z0-9_-]+\.[a-z0-9_-]+$/i,
      seedPermissions: [
        {
          key: "user1.read",
          name: "Read Users",
          description: "Can view users",
          isActive: true,
        },
      ],
      seedRoles: [
        {
          key: "admin1",
          name: "Administrator",
          description: "Full access",
          isActive: true,
          permissions: ["user1:read"],
        },
      ],
    }),
    adminPlusPlugin(),
  ],
})
