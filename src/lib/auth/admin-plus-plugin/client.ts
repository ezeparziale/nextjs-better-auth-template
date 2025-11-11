import { BetterAuthClientPlugin } from "better-auth"
import type { adminPlusPlugin } from "./index"

type AdminPlusPlugin = typeof adminPlusPlugin

export const adminPlusClient = () => {
  return {
    id: "admin-plus-client",
    $InferServerPlugin: {} as ReturnType<AdminPlusPlugin>,
  } satisfies BetterAuthClientPlugin
}
