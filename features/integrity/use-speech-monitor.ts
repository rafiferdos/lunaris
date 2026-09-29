"use client"
import { useEffect, useRef, useState } from "react"
import type { MicVAD } from "@ricky0123/vad-web"
export function useSpeechMonitor(active: boolean) {
  const instance = useRef<MicVAD | null>(null),
    mounted = useRef(false),
    activeRef = useRef(active)
  const [status, setStatus] = useState<
    "off" | "loading" | "ready" | "unavailable"
  >("off")
  useEffect(() => {
    activeRef.current = active
  }, [active])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      activeRef.current = false
      void instance.current?.destroy()
      instance.current = null
    }
  }, [])
  async function enable() {
    if (instance.current || status === "loading") return
    setStatus("loading")
    try {
      const { MicVAD } = await import("@ricky0123/vad-web")
      const detector = await MicVAD.new({
        model: "v5",
        baseAssetPath: "/vad/",
        onnxWASMBasePath: "/vad/",
        startOnLoad: true,
        ortConfig: (ort) => {
          ort.env.wasm.numThreads = 1
        },
        minSpeechMs: 3000,
        preSpeechPadMs: 0,
        onSpeechEnd: (audio) => {
          const durationMs = (audio.length / 16000) * 1000
          if (activeRef.current && durationMs >= 3000)
            window.dispatchEvent(
              new CustomEvent("lunaris:speech", { detail: durationMs })
            )
        },
      })
      if (!mounted.current) {
        await detector.destroy()
        return
      }
      instance.current = detector
      setStatus("ready")
    } catch {
      if (mounted.current) {
        setStatus("unavailable")
        window.dispatchEvent(new Event("lunaris:microphone-unavailable"))
      }
    }
  }
  return { status, enable }
}
