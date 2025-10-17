import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "./ui/badge"

export function Hero() {
  return (
    <section className="flex flex-col items-center justify-center gap-8 px-4 py-24 md:py-32 lg:py-40">
      <div className="flex max-w-4xl flex-col items-center gap-6 text-center">
        {/* Badge */}
        <Badge variant="secondary">Built with Next.js 15 🎉</Badge>

        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
          A better way to handle authentication in Next.js
        </h1>

        {/* Description */}
        <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed text-balance md:text-xl">
          This is a template with a complete and secure authentication system for your
          Next.js projects. It includes login, signup, password reset, email
          verification, and more.
        </p>

        {/* CTA Buttons */}
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/login">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
