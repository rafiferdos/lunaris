import type { Preferences } from "./schema"
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
