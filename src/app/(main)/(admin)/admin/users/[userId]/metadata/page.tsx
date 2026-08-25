import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth/guards"
import { definePage } from "@/lib/define-page"
import { getUser } from "@/data/auth/get-user"
import { PageShell } from "@/components/page-shell"
import { MetadataEditor } from "./_components/metadata-editor"

const PAGE = definePage({
  title: "Metadata",
  description: "Add metadata to a user.",
  callbackUrl: "/admin/users",
  section: "metadata",
})

export const metadata: Metadata = PAGE.metadata

type Params = Promise<{ userId: string }>

export default async function MetadataUserAdminPage(props: { params: Params }) {
  const { userId } = await props.params

  await requireAdmin(`${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  const user = await getUser(userId)

  if (!user) notFound()

  const metadata = JSON.stringify(user.metadata || {}, null, 2)

  return (
    <PageShell page={PAGE} isSection>
      <MetadataEditor userId={user.id} userMetadata={metadata} />
    </PageShell>
  )
}
