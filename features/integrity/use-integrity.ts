"use client"
import { useEffect, useEffectEvent, useState } from "react"
import { z } from "zod"
import type { IntegrityEvent } from "@/lib/api/types"
import { errorMessage } from "@/lib/api/client"
type Signal = Omit<IntegrityEvent, "sequence" | "clientTimestamp">
export function useIntegrity(
  active: boolean,
  attemptId: string,
  nextSequence: number,
  onEvent: (event: IntegrityEvent) => Promise<unknown>
) {
  const [warning, setWarning] = useState(""),
    [error, setError] = useState("")
  const deliver = useEffectEvent(onEvent)
  useEffect(() => {
    if (!active) return
    const key = `lunaris:integrity:${attemptId}`
    let sequence = nextSequence
    try {
      sequence = Math.max(sequence, Number(sessionStorage.getItem(key)) || 0)
    } catch {}
    const queueKey = `${key}:pending`
    const pendingSchema = z
      .array(
        z.object({
          sequence: z.number().int().nonnegative(),
          type: z.enum([
            "TAB_HIDDEN",
            "WINDOW_BLUR",
            "FULLSCREEN_EXIT",
            "FULLSCREEN_ENTER",
            "SPEECH_ACTIVITY",
            "MICROPHONE_UNAVAILABLE",
            "INTEGRITY_HEARTBEAT",
          ]),
          clientTimestamp: z.string().optional(),
          durationMs: z.number().optional(),
          confidence: z.number().optional(),
        })
      )
      .max(2000)
    let pending: IntegrityEvent[] = []
    try {
      const parsed = pendingSchema.safeParse(
        JSON.parse(sessionStorage.getItem(queueKey) ?? "[]")
      )
      if (parsed.success) pending = parsed.data
    } catch {}
    sequence = Math.max(sequence, ...pending.map((event) => event.sequence + 1))
    let delivering = false,
      closed = false
    const persist = () => {
      try {
        sessionStorage.setItem(queueKey, JSON.stringify(pending))
      } catch {}
    }
    async function flush() {
      if (delivering) return
      delivering = true
      try {
        while (pending.length) {
          await deliver(pending[0])
          pending.shift()
          persist()
        }
        if (!closed) setError("")
      } catch (error) {
        if (!closed)
          setError(
            errorMessage(error) +
              " Integrity signals will retry when the connection returns."
          )
      } finally {
        delivering = false
      }
    }
    function emit(signal: Signal) {
      if (pending.length >= 2000) return
      const event: IntegrityEvent = {
        ...signal,
        sequence: sequence++,
        clientTimestamp: new Date().toISOString(),
      }
      try {
        sessionStorage.setItem(key, String(sequence))
      } catch {}
      pending.push(event)
      persist()
      void flush()
    }
    const online = () => void flush()
    window.addEventListener("online", online)
    void flush()
    // A document being replaced on refresh is not a switch to another tab.
    // Keep ordinary visibility changes immediate; pagehide also covers bfcache.
    let departing = false
    const pagehide = () => {
      departing = true
    }
    const pageshow = () => {
      departing = false
    }
    window.addEventListener("pagehide", pagehide)
    window.addEventListener("pageshow", pageshow)
    const visibility = () => {
      if (document.hidden && !departing) {
        setWarning(
          "You left the assessment tab. The server may submit Competitive attempts immediately."
        )
        emit({ type: "TAB_HIDDEN" })
      }
    }
    const blur = () => {
      setWarning("The assessment window lost focus.")
      emit({ type: "WINDOW_BLUR" })
    }
    const full = () =>
      emit({
        type: document.fullscreenElement
          ? "FULLSCREEN_ENTER"
          : "FULLSCREEN_EXIT",
      })
    const speech = (event: Event) => {
      if (event instanceof CustomEvent) {
        const durationMs = Number(event.detail)
        if (Number.isFinite(durationMs) && durationMs >= 3000) {
          setWarning("Sustained speech activity was detected.")
          emit({
            type: "SPEECH_ACTIVITY",
            durationMs: Math.min(600000, Math.round(durationMs)),
          })
        }
      }
    }
    const unavailable = () => emit({ type: "MICROPHONE_UNAVAILABLE" })
    document.addEventListener("visibilitychange", visibility)
    window.addEventListener("blur", blur)
    document.addEventListener("fullscreenchange", full)
    window.addEventListener("lunaris:speech", speech)
    window.addEventListener("lunaris:microphone-unavailable", unavailable)
    const heartbeat = setInterval(
      () => emit({ type: "INTEGRITY_HEARTBEAT" }),
      30_000
    )
    return () => {
      closed = true
      window.removeEventListener("online", online)
      window.removeEventListener("pagehide", pagehide)
      window.removeEventListener("pageshow", pageshow)
      clearInterval(heartbeat)
      document.removeEventListener("visibilitychange", visibility)
      window.removeEventListener("blur", blur)
      document.removeEventListener("fullscreenchange", full)
      window.removeEventListener("lunaris:speech", speech)
      window.removeEventListener("lunaris:microphone-unavailable", unavailable)
    }
    // The server's starting sequence initializes one stream; subsequent responses must not rebind listeners.
  }, [active, attemptId, nextSequence])
  return { warning, error, dismiss: () => setWarning("") }
}
