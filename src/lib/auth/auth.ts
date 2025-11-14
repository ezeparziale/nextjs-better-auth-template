import { render } from "@react-email/components"
import { APIError, betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import {
  admin,
  createAuthMiddleware,
  lastLoginMethod,
  twoFactor,
} from "better-auth/plugins"
import { passkey } from "better-auth/plugins/passkey"
import { NewLoginEmail } from "../email/new-login"
import { reactPasswordChangedEmail } from "../email/password-changed"
import { reactResetPasswordEmail } from "../email/reset-password"
import { sendMail } from "../email/send-email"
import { reactVerifyEmail } from "../email/verify-email"
import { reactWelcomeEmail } from "../email/welcome"
import { parseUserAgent } from "../parse-user-agent"
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
      const resetLink = `${process.env.BETTER_AUTH_URL}/reset-password?token=${token}`
      const html = await render(reactResetPasswordEmail({ name: user.name, resetLink }))
      await sendMail(user.email, "Reset your password", html)
    },
    onPasswordReset: async ({ user }) => {
      const userEmail = user.email

      const html = await render(
        reactPasswordChangedEmail({
          userEmail,
          timestamp: new Date().toISOString(),
          secureAccountLink: `${process.env.BETTER_AUTH_URL}/forgot-password`,
          appName: "Nog",
        }),
      )

      await sendMail(userEmail, "Password changed", html)
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, token }) => {
      const verifyLink = `${process.env.BETTER_AUTH_URL}/verify-email?token=${token}`
      const html = await render(reactVerifyEmail({ name: user.name, verifyLink }))
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
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Send welcome email
          const loginLink = `${process.env.BETTER_AUTH_URL}/login`
          const html = await render(reactWelcomeEmail({ name: user.name, loginLink }))
          await sendMail(user.email, "Welcome to Nog", html)
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Change password detected
      if (ctx.path.startsWith("/change-password")) {
        const returned = ctx.context.returned

        if (returned instanceof APIError) {
          return
        }

        if (!ctx.context.session) return

        const userEmail = ctx.context.session.user.email

        const html = await render(
          reactPasswordChangedEmail({
            userEmail,
            timestamp: new Date().toISOString(),
            secureAccountLink: `${process.env.BETTER_AUTH_URL}/forgot-password`,
            appName: "Nog",
          }),
        )

        await sendMail(userEmail, "Password changed", html)
      }

      // New login detected
      if (ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/callback/:id")) {
        const session = ctx.context.newSession?.session

        if (!session) return

        const user = await ctx?.context.internalAdapter.findUserById(session.userId)

        if (user) {
          const { browser, os, location, ipAddress } = parseUserAgent(session)

          const html = await render(
            NewLoginEmail({
              name: user.name,
              browser,
              os,
              location,
              ipAddress,
              timestamp: new Date().toISOString(),
              secureAccountLink: `${process.env.BETTER_AUTH_URL}/settings/sessions`,
            }),
          )
          await sendMail(user.email, "New login detected", html)
        }
      }
    }),
  },
})
