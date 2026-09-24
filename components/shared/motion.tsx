"use client"
import { motion, useReducedMotion } from "motion/react"
import { usePreferences } from "@/features/settings/preferences"
export function PageEntrance({ children }: { children: React.ReactNode }) {
  const systemReduced = useReducedMotion()
  const preferences = usePreferences()
  return (
    <motion.div
      initial={
        systemReduced || preferences.reducedMotion
          ? false
          : { opacity: 0, y: 8 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}
