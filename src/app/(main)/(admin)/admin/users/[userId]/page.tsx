import type { Metadata } from "next"
import { redirect } from "next/navigation"

const PAGE = {
  title: "Edit user",
  description: "",
  callbackUrl: "/admin/users/",
}

export const metadata: Metadata = {
  title: PAGE.title,
  description: PAGE.description,
}

type Params = Promise<{ userId: string }>

export default async function UserAdminPage(props: { params: Params }) {
  const params = await props.params
  const userId = params.userId

  redirect(`/admin/users/${userId}/settings`)
}
