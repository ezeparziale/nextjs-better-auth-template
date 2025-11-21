import { GlobeIcon, PaletteIcon, ShieldCheckIcon, ZapIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GitHubIcon } from "@/components/ui/icons"

export function Features() {
  return (
    <section className="container mx-auto px-4 py-24 md:py-32">
      <div className="mb-16 flex flex-col items-center gap-4 text-center">
        <Badge
          variant="outline"
          className="border-primary/20 bg-primary/5 text-primary"
        >
          Features
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Everything you need to build faster
        </h2>
        <p className="text-muted-foreground max-w-2xl leading-normal sm:text-xl sm:leading-8">
          A complete authentication solution with modern UI components, ready for
          production.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:grid-rows-2">
        <div className="group bg-card relative overflow-hidden rounded-3xl border p-8 md:col-span-2 md:row-span-2">
          <div className="bg-primary/10 group-hover:bg-primary/20 absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full blur-3xl transition-all"></div>
          <div className="relative flex h-full flex-col justify-between gap-6">
            <div className="bg-background/50 w-fit rounded-2xl border p-4 backdrop-blur-sm">
              <ShieldCheckIcon className="text-primary h-8 w-8" />
            </div>
            <div>
              <h3 className="mb-2 text-2xl font-semibold">Enterprise Security</h3>
              <p className="text-muted-foreground">
                Built with industry-standard security practices. Includes session
                management, CSRF protection, and secure headers out of the box.
              </p>
            </div>
          </div>
        </div>
        <div className="group bg-card relative overflow-hidden rounded-3xl border p-6 md:col-span-1">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl transition-all group-hover:bg-blue-500/20"></div>
          <div className="relative flex flex-col gap-4">
            <div className="bg-background/50 w-fit rounded-xl border p-3 backdrop-blur-sm">
              <ZapIcon className="size-6 text-blue-500" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold">Blazing Fast</h3>
              <p className="text-muted-foreground text-sm">
                Optimized for performance with Next.js 16 and Turbopack.
              </p>
            </div>
          </div>
        </div>
        <div className="group bg-card relative overflow-hidden rounded-3xl border p-6 md:col-span-1">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-purple-500/10 blur-2xl transition-all group-hover:bg-purple-500/20"></div>
          <div className="relative flex flex-col gap-4">
            <div className="bg-background/50 w-fit rounded-xl border p-3 backdrop-blur-sm">
              <PaletteIcon className="size-6 text-purple-500" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold">Themable</h3>
              <p className="text-muted-foreground text-sm">
                Fully customizable UI with Tailwind CSS v4 and Shadcn UI.
              </p>
            </div>
          </div>
        </div>
        <div className="group bg-card relative overflow-hidden rounded-3xl border p-6 md:col-span-1">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl transition-all group-hover:bg-orange-500/20"></div>
          <div className="relative flex flex-col gap-4">
            <div className="bg-background/50 w-fit rounded-xl border p-3 backdrop-blur-sm">
              <GitHubIcon className="size-6 text-orange-500" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold">Open Source</h3>
              <p className="text-muted-foreground text-sm">
                MIT licensed. Use it for personal or commercial projects.
              </p>
            </div>
          </div>
        </div>
        <div className="group bg-card relative overflow-hidden rounded-3xl border p-6 md:col-span-1">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 h-32 w-32 rounded-full bg-green-500/10 blur-2xl transition-all group-hover:bg-green-500/20"></div>
          <div className="relative flex flex-col gap-4">
            <div className="bg-background/50 w-fit rounded-xl border p-3 backdrop-blur-sm">
              <GlobeIcon className="size-6 text-green-500" />
            </div>
            <div>
              <h3 className="mb-1 text-lg font-semibold">Edge Ready</h3>
              <p className="text-muted-foreground text-sm">
                Deploy anywhere. Compatible with Vercel Edge and Cloudflare.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
