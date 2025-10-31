import { useRef } from "react"
import { Search, X } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

  const handleSearch = useDebouncedCallback((query: string) => {
    onChange(query)
  }, debounceMs)

  const handleClear = () => {
    onClear()
  }

  return (
    <div className="relative max-w-sm flex-1">
      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value)
        }}
        defaultValue={value}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            inputRef?.current?.blur()
          }
        }}
        ref={inputRef}
        className="px-9"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 hover:bg-gray-100"
        >
          <X className="size-4 text-gray-400" />
        </Button>
      )}
    </div>
  )
}
