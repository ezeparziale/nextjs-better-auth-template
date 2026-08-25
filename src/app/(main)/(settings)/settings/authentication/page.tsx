import type { Metadata } from "next"
import { headers } from "next/headers"
import { Suspense } from "react"
import { auth } from "@/lib/auth/auth"
import { requireSession } from "@/lib/auth/guards"
import { PageHeader } from "@/components/page-header"
import ProvidersList from "./_components/providers-list"
import ProvidersListSkeleton from "./_components/providers-list-skeleton"

const PAGE = {
  title: "Authentication",
  description: "Manage your authentication settings.",
  callbackUrl: "/settings/authentication",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

export default async function Authentication() {
  await requireSession(PAGE.callbackUrl)

  const accounts = await auth.api.listUserAccounts({ headers: await headers() })

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <Suspense fallback={<ProvidersListSkeleton />}>
        <ProvidersList accounts={accounts} />
      </Suspense>
    </div>
  )
}
