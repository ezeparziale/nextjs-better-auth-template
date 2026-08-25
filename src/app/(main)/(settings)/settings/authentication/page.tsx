import type { Metadata } from "next"
import { headers } from "next/headers"
import { Suspense } from "react"
import { auth } from "@/lib/auth/auth"
import { requireSession } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { PageShell } from "@/components/page-shell"
import ProvidersList from "./_components/providers-list"
import ProvidersListSkeleton from "./_components/providers-list-skeleton"

const PAGE = definePage({
  title: "Authentication",
  description: "Manage your authentication settings.",
  callbackUrl: "/settings/authentication",
})

export const metadata: Metadata = PAGE.metadata

export default async function Authentication() {
  await requireSession(PAGE.callbackUrl)

  const accounts = await auth.api.listUserAccounts({ headers: await headers() })

  return (
    <PageShell page={PAGE} isSection>
      <Suspense fallback={<ProvidersListSkeleton />}>
        <ProvidersList accounts={accounts} />
      </Suspense>
    </PageShell>
  )
}
