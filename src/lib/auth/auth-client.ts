import { passkeyClient } from "@better-auth/passkey/client"
import {
  adminClient,
  inferAdditionalFields,
  lastLoginMethodClient,
  twoFactorClient,
} from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
import { adminPlusClient } from "./admin-plus-plugin/client"
import { auth } from "./auth"
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
    inferAdditionalFields<typeof auth>(),
  ],
})

export const { signIn, signOut, signUp, useSession } = authClient
