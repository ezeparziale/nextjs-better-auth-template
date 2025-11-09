import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { Falling } from "./illustrations/falling"
import { Button } from "./ui/button"

export default function NotFound404({
  message,
  linkText,
  link,
}: {
  message: string
  linkText: string
  link: string
}) {
  return (
    <div className="flex flex-col items-center">
      <Falling />
      <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{message}</h2>
      <Button asChild variant="default" size="sm" className="mt-6">
        <Link href={link}>
          <ArrowLeftIcon className="size-4" />
          {linkText}
        </Link>
      </Button>
    </div>
  )
}
