import Logo from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"

export function Footer() {
  return (
    <footer className="bg-background/50 border-t backdrop-blur-xl">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-8 md:flex-row">
        <div className="flex items-center gap-2">
          <Logo />
          <p className="text-muted-foreground text-sm">
            Built with Next.js and Better Auth.
          </p>
        </div>
        <ThemeToggle isDropDown={false} />
      </div>
    </footer>
  )
}
