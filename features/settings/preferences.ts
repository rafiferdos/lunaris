"use client"
import { z } from "zod"
import { useLocalValue, writeLocal } from "@/lib/local-store"
export const preferenceSchema = z.object({
  palette: z
    .enum(["taupe", "neutral", "stone", "zinc", "blue", "green", "rose"])
    .default("taupe"),
  radius: z
    .enum(["sharp", "compact", "default", "soft", "rounded"])
    .default("default"),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  reducedMotion: z.boolean().default(false),
  difficulty: z.enum(["easy", "medium", "competitive"]).default("easy"),
  timer: z.boolean().default(true),
  email: z.boolean().default(true),
  reminders: z.boolean().default(false),
  publicProfile: z.boolean().default(true),
  topics: z.array(z.string()).default(["javascript", "react"]),
})
export type Preferences = z.infer<typeof preferenceSchema>
export const defaults = preferenceSchema.parse({})
export function usePreferences() {
  return useLocalValue("lunaris:preferences", defaults, (v) =>
    preferenceSchema.parse(v)
  )
}
export function setPreferences(preferences: Preferences) {
  writeLocal("lunaris:preferences", preferences)
  applyPreferences(preferences)
}
export const radii = {
  sharp: "0rem",
  compact: "0.3rem",
  default: "0.625rem",
  soft: "0.85rem",
  rounded: "1.1rem",
}
export function applyPreferences(p: Preferences) {
  const root = document.documentElement
  root.dataset.palette = p.palette
  root.dataset.density = p.density
  root.dataset.reducedMotion = String(p.reducedMotion)
  root.style.setProperty("--radius", radii[p.radius])
}
