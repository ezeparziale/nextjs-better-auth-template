import { passkeyClient } from "@better-auth/passkey/client"
import {
  adminClient,
  lastLoginMethodClient,
  twoFactorClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { adminPlusClient } from "./admin-plus-plugin/client"
import { rbacClient } from "./rbac-plugin/client"

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    twoFactorClient({
      onTwoFactorRedirect: () => {
        const params = new URLSearchParams(window.location.search)
        const callbackUrl = params.get("callbackUrl")

        if (callbackUrl) {
          window.location.href = `/two-factor?callbackUrl=${encodeURIComponent(callbackUrl)}`
        } else {
          window.location.href = "/two-factor"
        }
      },
    }),
    passkeyClient(),
    lastLoginMethodClient(),
    rbacClient(),
    adminPlusClient(),
  ],
})

export const { signIn, signOut, signUp, useSession } = authClient
