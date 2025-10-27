import { PageHeader } from "@/components/page-header"
import ProvidersListSkeleton from "./_components/providers-list-skeleton"

const PAGE = {
  title: "Authentication",
  description: "Manage your authentication settings.",
}

export default function AuthenticationLoadingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <ProvidersListSkeleton />
    </div>
  )
}
