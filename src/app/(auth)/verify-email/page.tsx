import { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { CheckYourEmail } from "./check-your-email"
import { EmailVerification } from "./email-verification"

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
    content = <NoVerificationData />
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<VerificationLoader />}>{content}</Suspense>
      </div>
    </div>
  )
}

function NoVerificationData() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>No Verification Link</CardTitle>
        <CardDescription>
          It looks like you accessed this page directly. Please use the verification
          link sent to your email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Button type="button" className="w-full" variant="ghost">
            <Link href="/login">Back to login</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
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
