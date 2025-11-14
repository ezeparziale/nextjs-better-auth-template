"use client"

import {
  createContext,
  useState,
  type ChangeEvent,
  type ComponentProps,
  type ReactNode,
} from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

const PasswordInputContext = createContext<{ password: string } | null>(null)

export function PasswordInput({
  children,
  onChange,
  value,
  defaultValue,
  ...props
}: Omit<ComponentProps<typeof Input>, "type"> & {
  children?: ReactNode
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState(defaultValue ?? "")

  const Icon = showPassword ? EyeOffIcon : EyeIcon
  const currentValue = value ?? password

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    onChange?.(e)
  }

  return (
    <PasswordInputContext value={{ password: currentValue.toString() }}>
      <div className="space-y-3">
        <InputGroup>
          <InputGroupInput
            {...props}
            value={value}
            defaultValue={defaultValue}
            type={showPassword ? "text" : "password"}
            onChange={handleChange}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" onClick={() => setShowPassword((p) => !p)}>
              <Icon className="size-4.5" />
              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {children}
      </div>
    </PasswordInputContext>
  )
}
