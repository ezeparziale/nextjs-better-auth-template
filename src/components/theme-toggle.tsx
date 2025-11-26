"use client"

import { useEffect, useState } from "react"
import { LaptopMinimalIcon, MoonIcon, Sun, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle({ isDropDown = true }: { isDropDown?: boolean }) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  if (isDropDown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          asChild
          className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
        >
          <Button variant="ghost" size="icon" aria-label="Choose a theme">
            <SunIcon className="size-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
            <MoonIcon className="absolute size-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            aria-label="Set light theme"
          >
            <Sun className="size-4" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            aria-label="Set dark theme"
          >
            <MoonIcon className="size-4" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            aria-label="Set system theme"
          >
            <LaptopMinimalIcon className="size-4" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex flex-row items-center space-x-1 rounded-full border p-1">
      {[
        { name: "light", icon: SunIcon, label: "Light theme" },
        { name: "system", icon: LaptopMinimalIcon, label: "System theme" },
        { name: "dark", icon: MoonIcon, label: "Dark theme" },
      ].map(({ name, icon: Icon, label }) => (
        <button
          key={name}
          className={cn("rounded-full p-1", theme === name && "bg-muted-foreground/20")}
          onClick={() => setTheme(name)}
          role="radio"
          aria-checked={theme === name}
          aria-label={label}
        >
          <Icon className="size-4 transition-all" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
