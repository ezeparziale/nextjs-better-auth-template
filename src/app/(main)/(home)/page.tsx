import { Header } from "@/components/header"
import { Hero } from "@/components/hero"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
      </main>
    </div>
  )
}
