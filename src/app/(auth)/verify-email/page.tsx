import { Suspense } from "react"
import { CheckYourEmail } from "./check-your-email"
import { EmailVerification } from "./email-verification"

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { token?: string }
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense fallback={<div>Loading...</div>}>
          {searchParams.token ? (
            <EmailVerification token={searchParams.token} />
          ) : (
            <CheckYourEmail />
          )}
        </Suspense>
      </div>
    </div>
  )
}
