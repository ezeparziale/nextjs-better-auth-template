"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

interface DataTableSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  debounceMs?: number
}

export function DataTableSearch({
  value,
  onChange,
  onClear,
  placeholder = "Search…",
  debounceMs = 500,
}: DataTableSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleSearch = useDebouncedCallback((query: string) => {
    onChange(query)
  }, debounceMs)

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    handleSearch(newValue)
  }

  const handleClear = () => {
    setLocalValue("")
    onClear()
    inputRef.current?.focus()
  }

  return (
    <InputGroup className="h-8 max-w-sm min-w-[150px] flex-1 lg:w-[250px]">
      <InputGroupAddon align="inline-start" className="cursor-default">
        <Search className="text-muted-foreground size-4" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            inputRef.current?.blur()
          }
        }}
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" variant="ghost" onClick={handleClear}>
            <X className="text-muted-foreground size-4" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
