"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/page-header"

const settingsNav = [
  { name: "Profile", href: "/settings/profile" },
  { name: "Sessions", href: "/settings/sessions" },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="container space-y-6 py-8">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />

      <Separator />

      <div className="flex flex-col gap-6 md:flex-row">
        <nav className="flex flex-row gap-2 md:w-48 md:flex-col">
          {settingsNav.map((item) => {
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

        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
