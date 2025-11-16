import Link from "next/link"
import { ZapIcon as Icon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Logo({ disableName = false }: { disableName?: boolean }) {
  return (
    <div className="flex justify-center">
      <Link href="/">
        <div className="flex items-center gap-2">
          <Icon className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md" />
          {!disableName && (
            <p
              className={cn(
                "text-primary hidden font-bold antialiased sm:text-sm md:block md:text-2xl lg:text-2xl",
              )}
            >
              Nog
            </p>
          )}
        </div>
      </Link>
    </div>
  )
}
