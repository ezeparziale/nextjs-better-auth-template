import Link from "next/link"
import React from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CalledHelp } from "@/components/illustrations/called-help"
import { CrashedError } from "@/components/illustrations/crashed-error"
import Logo from "@/components/logo"
import MaxWidthWrapper from "@/components/max-width-wrapper"

const errorTypes: { [key: string]: { message: string; svg?: React.FC } } = {
  access_denied: {
    message: "Oops! This user account is blocked",
    svg: CalledHelp,
  },
  access_unauthorized: {
    message: "Oops! Access Unauthorized",
    svg: CalledHelp,
  },
  banned: { message: "Oops! This user account is banned", svg: CalledHelp },
  confirm_email: { message: "Please confirm your email" },
  token_expired: { message: "Oops! Token expired", svg: CrashedError },
  default: { message: "Something went wrong!", svg: CrashedError },
}

type SearchParams = Promise<{ error: string; error_description: string }>

export default async function ErrorPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams

  const { error: errorParam, error_description } = searchParams
  const errorMessage =
    errorParam && errorTypes[errorParam] ? errorTypes[errorParam] : errorTypes.Default

  const ErrorSvg = errorMessage.svg

  return (
    <MaxWidthWrapper variant="centered">
      <div className="flex flex-col items-center gap-3 rounded-md">
        <Logo />
        {ErrorSvg && <ErrorSvg />}
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          {errorMessage.message}
        </h2>
        <span>{error_description}</span>
        <Button asChild variant="default" size="sm">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </MaxWidthWrapper>
  )
}
