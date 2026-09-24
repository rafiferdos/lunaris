"use client"
import { useSearchParams, usePathname } from "next/navigation"
export function useUrlFilters() {
  const params = useSearchParams()
  const pathname = usePathname()
  return {
    get: (key: string, fallback = "") => params.get(key) ?? fallback,
    set: (updates: Record<string, string>) => {
      const next = new URLSearchParams(window.location.search)
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value)
        else next.delete(key)
      }
      window.history.replaceState(null, "", `${pathname}?${next}`)
    },
  }
}
