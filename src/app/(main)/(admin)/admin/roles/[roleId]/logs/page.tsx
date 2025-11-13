import type { Metadata } from "next"
import { headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"
import { DateDescription } from "@/components/date-description"
import { PageHeader } from "@/components/page-header"
import { getRole } from "../get-role"

const PAGE = {
  title: "Logs",
  description: "Here you can see the logs of this role.",
  callbackUrl: "/admin/logs",
  section: "logs",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ roleId: string }>

export default async function LogsRoleAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { roleId } = await props.params

  if (!session)
    redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${roleId}/${PAGE.section}`)

  if (session.user.role !== "admin") redirect("/dashboard")

  const role = await getRole(roleId)

  if (!role) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Created At</h3>
          <p className="text-muted-foreground text-sm">
            <DateDescription date={role.createdAt} />
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Updated At</h3>
          <p className="text-muted-foreground text-sm">
            <DateDescription date={role.updatedAt} />
          </p>
        </div>
      </div>
    </div>
  )
}
