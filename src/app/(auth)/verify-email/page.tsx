import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { CheckYourEmail } from "./_components/check-your-email"
import { EmailVerification } from "./_components/email-verification"

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your email address",
}

type SearchParams = Promise<{ token?: string; email?: string }>

export default async function VerifyEmailPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams
  const { token, email } = searchParams

  let content
  if (token) {
    content = <EmailVerification token={token} />
  } else if (email) {
    content = <CheckYourEmail email={email} />
  } else {
    redirect("/login")
  }

  return <Suspense fallback={<VerificationLoader />}>{content}</Suspense>
}

function VerificationLoader() {
  return (
    <Card>
      <CardContent>
        <div className="flex-start flex items-center gap-2">
          <Spinner />
          <p className="text-muted-foreground text-sm">Verifying your email…</p>
        </div>
      </CardContent>
    </Card>
  )
}
