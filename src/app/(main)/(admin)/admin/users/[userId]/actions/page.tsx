import { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prismadb from "@/lib/prismadb"
import { PageHeader } from "@/components/page-header"
import ImpersonateUserCard from "./_components/impersonate-user-card"

const PAGE = {
  title: "Actions",
  description: "Actions",
  callbackUrl: "/admin/users",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ userId: string }>

export default async function ActionsUserAdminPage(props: { params: Params }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const { userId } = await props.params

  if (!session) redirect(`/login?callbackUrl=${PAGE.callbackUrl}/${userId}/actions`)

  if (session.user.role !== "admin") redirect("/dashboard")

  const userHasPassword = !!(await prismadb.account.findFirst({
    where: { userId: userId, providerId: "credential" },
  }))

  console.log(userHasPassword)

  return (
    <div className="space-y-6">
      <PageHeader title={PAGE.title} description={PAGE.description} isSection />
      <ImpersonateUserCard userId={userId} />
    </div>
  )
}
