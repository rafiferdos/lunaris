"use client"
import { useSyncExternalStore } from "react"
const eventName = "lunaris:storage"
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(eventName, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(eventName, callback)
  }
}
export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
export function writeLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event(eventName))
}
export function useLocalValue<T>(
  key: string,
  fallback: T,
  parse: (value: unknown) => T
): T {
  const raw = useSyncExternalStore(
    subscribe,
    () => readLocal(key),
    () => null
  )
  if (!raw) return fallback
  try {
    return parse(JSON.parse(raw))
  } catch {
    return fallback
  }
}
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}
