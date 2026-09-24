import Link from "next/link"
import { ArrowUpRight, SearchX } from "lucide-react"
import { cn } from "@/lib/utils"
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
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p className="muted mt-2">{description}</p>
      </div>
      {action}
    </header>
  )
}
export function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return <section className={cn("panel", className)}>{children}</section>
}
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode
  tone?: string
}) {
  return <span className={cn("badge", `tone-${tone}`)}>{children}</span>
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
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
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
  name = "Rafi Ferdos",
  small = false,
}: {
  name?: string
  small?: boolean
}) {
  return (
    <span aria-hidden="true" className={cn("avatar", small && "avatar-small")}>
      {name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")}
    </span>
  )
}
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly (string | { value: string; label: string })[]
}) {
  return (
    <label className="select-label">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) =>
          typeof option === "string" ? (
            <option key={option} value={option}>
              {option}
            </option>
          ) : (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  )
}
