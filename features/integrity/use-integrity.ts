"use client"
import { useEffect, useState } from "react"
export interface IntegrityEvents {
  tabSwitches: number
  focusLosses: number
  fullscreenExits: number
  speechEvents: number
  warnings: number
}
export function useIntegrity(active: boolean, fullscreen: boolean) {
  const [events, setEvents] = useState<IntegrityEvents>({
    tabSwitches: 0,
    focusLosses: 0,
    fullscreenExits: 0,
    speechEvents: 0,
    warnings: 0,
  })
  const [warning, setWarning] = useState("")
  useEffect(() => {
    if (!active) return
    let lastEvent = 0
    function record(
      kind: "tabSwitches" | "focusLosses" | "fullscreenExits",
      message: string
    ) {
      const now = Date.now()
      if (now - lastEvent < 700) return
      lastEvent = now
      setEvents((previous) => ({
        ...previous,
        [kind]: previous[kind] + 1,
        warnings: previous.warnings + 1,
      }))
      setWarning(message)
    }
    const visibility = () => {
      if (document.hidden)
        record(
          "tabSwitches",
          "The assessment tab was left. Return your focus here to keep your session consistent."
        )
    }
    const blur = () =>
      record(
        "focusLosses",
        "This window lost focus. Keep the assessment in view while answering."
      )
    const full = () => {
      if (fullscreen && !document.fullscreenElement)
        record(
          "fullscreenExits",
          "Fullscreen was exited. You can restore it below."
        )
    }
    document.addEventListener("visibilitychange", visibility)
    window.addEventListener("blur", blur)
    document.addEventListener("fullscreenchange", full)
    return () => {
      document.removeEventListener("visibilitychange", visibility)
      window.removeEventListener("blur", blur)
      document.removeEventListener("fullscreenchange", full)
    }
  }, [active, fullscreen])
  return {
    events,
    warning,
    dismiss: () => setWarning(""),
    score: Math.max(0, 100 - events.warnings * 8),
  }
}
