import NotFound404 from "@/components/404"
import MaxWidthWrapper from "@/components/max-width-wrapper"

export default function NotFoundPage() {
  return (
    <MaxWidthWrapper variant="centered">
      <NotFound404 />
    </MaxWidthWrapper>
  )
}
