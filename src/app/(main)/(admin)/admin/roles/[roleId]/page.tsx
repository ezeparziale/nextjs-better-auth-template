import type { Metadata } from "next"
import { redirect } from "next/navigation"

const PAGE = {
  title: "Edit role",
  description: "Edit the role's settings.",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ roleId: string }>

export default async function RoleAdminPage(props: { params: Params }) {
  const params = await props.params
  const roleId = params.roleId

  redirect(`/admin/roles/${roleId}/settings`)
}
