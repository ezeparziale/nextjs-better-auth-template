"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type AsyncComboboxOption = {
  value: string
  label: string
}

export function AsyncCombobox({
  value,
  onValueChange,
  fetchOptions,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  disabled,
  debounceMs = 300,
}: {
  value?: string
  onValueChange: (value: string) => void
  fetchOptions: (search: string) => Promise<AsyncComboboxOption[]>
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  debounceMs?: number
}) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<AsyncComboboxOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedLabel, setSelectedLabel] = useState<string | undefined>()
  const initialLoadRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(
    async (query: string) => {
      setIsLoading(true)
      try {
        setOptions(await fetchOptions(query))
      } catch (error) {
        console.error("Error fetching options:", error)
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    },
    [fetchOptions],
  )

  // Initial load when the popover opens
  useEffect(() => {
    if (open && !initialLoadRef.current) {
      load("")
      initialLoadRef.current = true
    }
  }, [open, load])

  // Debounced search as the user types
  useEffect(() => {
    if (!open) return

    // The initial empty load is handled by the previous effect
    if (!search && !initialLoadRef.current) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      load(search)
    }, debounceMs)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [search, open, load, debounceMs])

  // Keep the selected label in sync with the external value
  const effectiveLabel = value ? (selectedLabel ?? value) : undefined

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-sm font-normal shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
        >
          {effectiveLabel ?? (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="min-w-(--radix-popover-trigger-width) p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            autoFocus
          />
          <CommandList>
            {isLoading && options.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
              </div>
            ) : options.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => {
                      setSelectedLabel(option.label)
                      onValueChange(option.value)
                      setOpen(false)
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                <div className="text-muted-foreground border-t px-3 py-2 text-center text-xs">
                  {isLoading
                    ? "Searching..."
                    : `Showing up to ${options.length} results. Keep typing to refine...`}
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
