"use client"
import { createContext, useContext, useSyncExternalStore } from "react"
import { LazyMotion, MotionConfig, m, useReducedMotion } from "motion/react"

const loadFeatures = () =>
  import("./motion-features").then((module) => module.default)
const ReducedMotion = createContext(true)
function subscribe(listener: () => void) {
  const observer = new MutationObserver(listener)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-reduced-motion"],
  })
  return () => observer.disconnect()
}
function snapshot() {
  return document.documentElement.dataset.reducedMotion === "true"
}
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const preference = useSyncExternalStore(subscribe, snapshot, () => true)
  const system = useReducedMotion()
  const reduced = preference || !!system
  return (
    <ReducedMotion value={reduced}>
      <LazyMotion features={loadFeatures} strict>
        <MotionConfig
          reducedMotion={reduced ? "always" : "user"}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </MotionConfig>
      </LazyMotion>
    </ReducedMotion>
  )
}
export function useMotionReduced() {
  return useContext(ReducedMotion)
}
export function PageEntrance({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduced = useMotionReduced()
  return (
    <m.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {children}
    </m.div>
  )
}
export function Reveal({
  children,
  index = 0,
}: {
  children: React.ReactNode
  index?: number
}) {
  const reduced = useMotionReduced()
  return (
    <m.div
      className="reveal-item"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.22,
        delay: reduced ? 0 : Math.min(index, 5) * 0.025,
      }}
    >
      {children}
    </m.div>
  )
}
