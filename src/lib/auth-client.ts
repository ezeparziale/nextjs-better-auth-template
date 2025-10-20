import { passkeyClient, twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  plugins: [
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
  ],
})

export const { signIn, signOut, signUp, useSession } = authClient
