import { AnimatedBackground } from "@/components/ui/animated-background"
import Logo from "@/components/logo"
import MaxWidthWrapper from "@/components/max-width-wrapper"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AnimatedBackground />
      <MaxWidthWrapper variant="auth" className="relative z-10">
        <Logo />
        {children}
      </MaxWidthWrapper>
    </>
  )
}
