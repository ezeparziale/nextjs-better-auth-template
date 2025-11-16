import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const wrapperVariants = cva("", {
  variants: {
    variant: {
      default: "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8",
      centered:
        "mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex min-h-svh items-center justify-center",
      auth: "flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const innerVariants = cva("", {
  variants: {
    variant: {
      default: "",
      centered: "",
      auth: "flex w-full max-w-sm flex-col gap-6",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface MaxWidthWrapperProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof wrapperVariants> {}

export default function MaxWidthWrapper({
  children,
  className,
  variant,
  ...props
}: MaxWidthWrapperProps) {
  const wrapperClasses = cn(wrapperVariants({ variant }), className)

  if (variant === "auth") {
    return (
      <div className={wrapperClasses} {...props}>
        <div className={innerVariants({ variant })}>{children}</div>
      </div>
    )
  }

  // centered y default comparten esto
  return (
    <div className={wrapperClasses} {...props}>
      {children}
    </div>
  )
}
