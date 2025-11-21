import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { PageHeader } from "@/components/page-header"
import { getUser } from "../get-user"
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
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const params = await props.params
  const userId = params.userId

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${userId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/dashboard")

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
