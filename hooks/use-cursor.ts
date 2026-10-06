"use client"
import { useState } from "react"
export function useCursor() {
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined])
  return {
    cursor: cursors.at(-1),
    page: cursors.length - 1,
    next: (cursor: string | null | undefined) => {
      if (cursor) setCursors((value) => [...value, cursor])
    },
    previous: () =>
      setCursors((value) => (value.length > 1 ? value.slice(0, -1) : value)),
    reset: () => setCursors([undefined]),
  }
}
