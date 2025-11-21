import Link from "next/link"
import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden py-24 md:py-32 lg:py-40">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[14px_24px] dark:bg-black">
        <div className="bg-primary/20 absolute top-0 right-0 left-0 -z-10 m-auto h-[310px] w-[310px] rounded-full opacity-20 blur-[100px]"></div>
      </div>
      <div className="container flex max-w-5xl flex-col items-center gap-8 px-4 text-center">
        <Badge
          variant="secondary"
          className="animate-in fade-in slide-in-from-bottom-4 border-primary/10 gap-2 px-4 py-2 text-sm backdrop-blur-sm duration-1000"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          Built with Next.js 16
        </Badge>
        <h1 className="animate-in fade-in slide-in-from-bottom-8 from-foreground to-foreground/70 bg-linear-to-b bg-clip-text text-4xl font-bold tracking-tight text-transparent delay-100 duration-1000 sm:text-6xl md:text-7xl lg:text-8xl">
          A better way to handle <br className="hidden md:block" />
          <span className="from-primary to-primary/60 bg-linear-to-r bg-clip-text text-transparent">
            authentication
          </span>
        </h1>
        <p className="animate-in fade-in slide-in-from-bottom-8 text-muted-foreground max-w-2xl text-lg leading-relaxed delay-200 duration-1000 md:text-xl">
          Complete and secure authentication system for your Next.js projects. Includes
          login, signup, password reset, email verification, and more.
        </p>
        <div className="animate-in fade-in slide-in-from-bottom-8 flex flex-col items-center gap-4 delay-300 duration-1000 sm:flex-row">
          <Button size="lg" className="h-12 px-8 text-base" asChild>
            <Link href="/login">
              Get Started
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
            <Link
              href="https://github.com/ezeparziale/nextjs-better-auth-template"
              target="_blank"
            >
              View on GitHub
            </Link>
          </Button>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-8 text-muted-foreground mt-12 flex flex-wrap items-center justify-center gap-8 text-sm delay-500 duration-1000">
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="text-primary size-4" />
            <span>Next.js 16</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="text-primary size-4" />
            <span>Better Auth</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="text-primary size-4" />
            <span>Prisma</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2Icon className="text-primary size-4" />
            <span>Tailwind v4</span>
          </div>
        </div>
      </div>
    </section>
  )
}
