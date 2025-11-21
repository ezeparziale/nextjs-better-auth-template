import Link from "next/link"

export default function Logo({ disableName = false }: { disableName?: boolean }) {
  return (
    <div className="flex justify-center">
      <Link href="/">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-5"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          {!disableName && (
            <span className="text-xl font-bold tracking-tight">Nog</span>
          )}
        </div>
      </Link>
    </div>
  )
}
