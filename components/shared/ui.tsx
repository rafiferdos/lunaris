"use client"
import { m } from "motion/react"
import { useMotionReduced } from "./motion"
import { Card } from "@/components/ui/card"
import { Badge as ShadcnBadge } from "@/components/ui/badge"
import { Avatar as ShadcnAvatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress as ShadcnProgress } from "@/components/ui/progress"
import Link from "@/components/shared/app-link"
import { ArrowUpRight, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
const MotionCard = m.create(Card)
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  const reduced = useMotionReduced()
  return (
    <m.header
      className="page-heading"
      initial={reduced ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="muted mt-2">{description}</p>
      </div>
      {action}
    </m.header>
  )
}
export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  const reduced = useMotionReduced()
  return (
    <MotionCard
      className={cn("panel block gap-0", className)}
      initial={reduced ? false : { opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.05 }}
    >
      {children}
    </MotionCard>
  )
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: string
}) {
  return (
    <ShadcnBadge variant="secondary" className={cn("badge", `tone-${tone}`)}>
      {children}
    </ShadcnBadge>
  )
}
export function Metric({
  label,
  value,
  note,
}: {
  label: string
  value: string | number
  note?: string
}) {
  return (
    <div className="metric">
      <p className="muted text-xs">{label}</p>
      <p className="metric-value">{value}</p>
      {note && <p className="muted mt-1 text-xs">{note}</p>}
    </div>
  )
}
export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <ShadcnProgress
      value={Math.min(100, Math.max(0, value))}
      aria-label={label}
    />
  )
}

export function TextLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className="text-link">
      {children}
      <ArrowUpRight size={15} />
    </Link>
  )
}
export function EmptyState({
  title = "No matches yet",
  description = "Try a different search or clear your filters.",
  children,
}: {
  title?: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="empty-state">
      <SearchX size={28} />
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {children}
    </div>
  )
}
export function Avatar({
  name = "Member",
  small = false,
}: {
  name?: string
  small?: boolean
}) {
  return (
    <ShadcnAvatar
      aria-hidden="true"
      className={cn("avatar", small && "avatar-small")}
    >
      <AvatarFallback>
        {name
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")}
      </AvatarFallback>
    </ShadcnAvatar>
  )
}
export { Select } from "./select"
