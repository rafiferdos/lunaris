"use client"
import { useEffect, useState } from "react"
export function remainingSeconds(
  expiresAt: string,
  serverTime: string,
  receivedAt: number,
  now: number
) {
  return Math.max(
    0,
    Math.ceil(
      (Date.parse(expiresAt) - Date.parse(serverTime) - (now - receivedAt)) /
        1000
    )
  )
}
export function useCountdown(
  expiresAt: string,
  serverTime: string,
  receivedAt: number
) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [])
  return remainingSeconds(expiresAt, serverTime, receivedAt, now)
}
