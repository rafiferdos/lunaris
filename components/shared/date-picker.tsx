"use client"
import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
function localDate(value: string) {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}
function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}
export function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? localDate(value) : undefined
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-label={label}
            className="min-w-40 justify-between"
          />
        }
      >
        {selected
          ? selected.toLocaleDateString("en", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : label}
        <CalendarDays />
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(date ? dateKey(date) : "")
            setOpen(false)
          }}
          disabled={(date) =>
            (!!min && dateKey(date) < min) || (!!max && dateKey(date) > max)
          }
        />
        {value && (
          <Button
            variant="ghost"
            className="m-2"
            onClick={() => {
              onChange("")
              setOpen(false)
            }}
          >
            Clear date
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
