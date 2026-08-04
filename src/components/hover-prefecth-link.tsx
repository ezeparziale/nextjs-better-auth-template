"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

interface HoverPrefetchLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function HoverPrefetchLink({
  href,
  children,
  className,
}: HoverPrefetchLinkProps) {
  const router = useRouter()

  const handleMouseEnter = () => {
    router.prefetch(href)
  }

  return (
    <Link
      href={href}
      className={className}
      prefetch={false}
      onMouseEnter={handleMouseEnter}
      onFocus={handleMouseEnter}
    >
      {children}
    </Link>
  )
}
