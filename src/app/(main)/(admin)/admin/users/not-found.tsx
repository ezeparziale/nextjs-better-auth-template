import NotFound404 from "@/components/404"

export default function UserNotFound() {
  return (
    <NotFound404 message="User not found" linkText="Go to users" link="/admin/users" />
  )
}
