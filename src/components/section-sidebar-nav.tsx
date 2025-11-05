"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavItem } from "@/types/types"
import { cn } from "@/lib/utils"

interface SidebarNavProps {
  items: NavItem[]
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-row gap-2 md:w-48 md:flex-col">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/settings" && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
