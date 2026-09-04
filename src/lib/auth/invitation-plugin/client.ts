import { BetterAuthClientPlugin } from "better-auth"
import type { invitationPlugin } from "./index"

type InvitationPlugin = typeof invitationPlugin

export const invitationClient = () => {
  return {
    id: "invitation-client",
    $InferServerPlugin: {} as ReturnType<InvitationPlugin>,
  } satisfies BetterAuthClientPlugin
}
