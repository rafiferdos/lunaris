"use client"
import { useEffect, useState } from "react"
export function useAttemptLease(id: string) {
  const [state, setState] = useState<"checking" | "owned" | "blocked">(
      "checking"
    ),
    [retryCount, setRetryCount] = useState(0)
  useEffect(() => {
    let closed = false,
      release: (() => void) | undefined
    if (!navigator.locks) {
      void Promise.resolve().then(() => {
        if (!closed) setState("owned")
      })
      return () => {
        closed = true
      }
    }
    // Defer acquisition so React Strict Mode can cancel its probe effect first.
    void Promise.resolve()
      .then(() => {
        if (closed) return
        return navigator.locks.request(
          `lunaris:attempt:${id}`,
          { ifAvailable: true },
          async (lock) => {
            if (closed) return
            if (!lock) {
              setState("blocked")
              return
            }
            setState("owned")
            await new Promise<void>((resolve) => {
              release = resolve
            })
          }
        )
      })
      .catch(() => {
        if (!closed) setState("blocked")
      })
    return () => {
      closed = true
      release?.()
    }
  }, [id, retryCount])
  return { state, retry: () => setRetryCount((value) => value + 1) }
}
