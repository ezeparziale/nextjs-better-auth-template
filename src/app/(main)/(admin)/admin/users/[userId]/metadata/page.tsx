import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { getUser } from "@/data/auth/get-user"
import { PageHeader } from "@/components/page-header"
import { MetadataEditor } from "./_components/metadata-editor"

const PAGE = {
  title: "Metadata",
  description: "Add metadata to a user.",
  callbackUrl: "/admin/users",
  section: "metadata",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ userId: string }>

export default async function MetadataUserAdminPage(props: { params: Params }) {
  const { userId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  const user = await getUser(userId)

  if (!user) notFound()

  const metadata = JSON.stringify(user.metadata || {}, null, 2)

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <MetadataEditor userId={user.id} userMetadata={metadata} />
    </div>
  )
}
