import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import {
  admin,
  createAuthMiddleware,
  lastLoginMethod,
  twoFactor,
} from "better-auth/plugins"
import { passkey } from "better-auth/plugins/passkey"
import { db } from "../db"
import {
  sendNewLoginEmail,
  sendPasswordChangedEmail,
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../email/send-email"
import { adminPlusPlugin } from "./admin-plus-plugin"
import { rbacPlugin } from "./rbac-plugin"

// import "server-only"

export const SUPPORTED_OAUTH_PROVIDERS = ["credential", "google", "github"] as const
export type SupportedOAuthProvider = (typeof SUPPORTED_OAUTH_PROVIDERS)[number]

export const auth = betterAuth({
  appName: "Template",
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      createdBy: {
        type: "string",
        required: false,
        fieldName: "created_by",
      },
      updatedBy: {
        type: "string",
        required: false,
        fieldName: "updated_by",
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, token }) => {
      await sendResetPasswordEmail(user, token)
    },
    onPasswordReset: async ({ user }) => {
      await sendPasswordChangedEmail(user.email)
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, token }) => {
      await sendVerificationEmail(user, token)
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
      disabledEndpoints: [],
    }),
    adminPlusPlugin(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          return {
            data: {
              ...user,
              createdBy: ctx?.context.session?.user.email || null,
              updatedBy: ctx?.context.session?.user.email || null,
            },
          }
        },
        after: async (user) => {
          await sendWelcomeEmail(user)
        },
      },
      update: {
        before: async (user, ctx) => {
          return {
            data: {
              ...user,
              updatedBy: ctx?.context.session?.user.email || null,
            },
          }
        },
      },
    },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Change password detected
      if (ctx.path.startsWith("/change-password")) {
        await sendPasswordChangedEmail(ctx)
      }

      // New login detected
      if (ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/callback/:id")) {
        await sendNewLoginEmail(ctx)
      }
    }),
  },
  onAPIError: {
    errorURL: "/error",
  },
  disabledPaths: ["/error"],
})
