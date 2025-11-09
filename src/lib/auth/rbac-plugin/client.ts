import { BetterAuthClientPlugin } from "better-auth"
import type { rbacPlugin } from "./index"

type RbacPlugin = typeof rbacPlugin

export const rbacClient = () => {
  return {
    id: "rbac-client",
    $InferServerPlugin: {} as ReturnType<RbacPlugin>,
  } satisfies BetterAuthClientPlugin
}
