import Logo from "@/components/logo"
import MaxWidthWrapper from "@/components/max-width-wrapper"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <MaxWidthWrapper variant="auth">
      <Logo />
      {children}
    </MaxWidthWrapper>
  )
}
