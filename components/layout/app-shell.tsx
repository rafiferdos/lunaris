"use client"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Orbit,
  LayoutGrid,
  Trophy,
  ChartNoAxesCombined,
  History,
  UserRound,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
  Bell,
  Menu,
  X,
  ArrowUpRight,
  Flame,
} from "lucide-react"
import { Avatar, Progress } from "@/components/shared/ui"
import { Button } from "@/components/ui/button"
import {
  useAttempts,
  attemptAvailability,
} from "@/features/history/use-attempts"
import { activitySummary } from "@/features/stats/activity"
import { useProfile } from "@/features/profile/use-profile"
const navigation = [
  { href: "/assessments", label: "Assessments", icon: LayoutGrid },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/stats", label: "My Stats", icon: ChartNoAxesCombined },
  { href: "/history", label: "History", icon: History },
]
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const profile = useProfile()
  const attempts = useAttempts()
  const activity = activitySummary(attempts)
  const availability = attemptAvailability(attempts)
  const mobileDialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (mobile) mobileDialog.current?.showModal()
    else mobileDialog.current?.close()
  }, [mobile])
  useEffect(() => {
    if (!notifications) return
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNotifications(false)
    }
    window.addEventListener("keydown", dismiss)
    return () => window.removeEventListener("keydown", dismiss)
  }, [notifications])
  const current =
    navigation.find((n) => pathname.startsWith(n.href))?.label ??
    (pathname.startsWith("/results")
      ? "Assessment results"
      : pathname.startsWith("/admin")
        ? "Question import"
        : pathname.split("/")[1])
  const nav = (secondary = false) =>
    (secondary
      ? [
          { href: "/profile", label: "Profile", icon: UserRound },
          { href: "/settings", label: "Settings", icon: Settings2 },
        ]
      : navigation
    ).map(({ href, label, icon: Icon }) => (
      <Link
        key={href}
        href={href}
        onClick={() => setMobile(false)}
        className={`nav-link ${pathname.startsWith(href) ? "active" : ""}`}
        aria-current={pathname.startsWith(href) ? "page" : undefined}
        title={collapsed ? label : undefined}
      >
        <Icon size={19} />
        <span>{label}</span>
        {label === "Assessments" && <span className="nav-count">26</span>}
      </Link>
    ))
  return (
    <div className={`app-shell ${collapsed ? "is-collapsed" : ""}`}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/assessments" className="brand">
          <Orbit size={29} strokeWidth={1.5} />
          <span>
            lunaris<span className="brand-dot">.</span>
          </span>
        </Link>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation">{nav()}</nav>
        <div className="sidebar-bottom">
          <div className="practice-note">
            <div className="flex items-center gap-2">
              <Flame size={17} />
              <strong>A little, every day.</strong>
            </div>
            <p>
              Consistency is a skill, too.
              <br />
              {activity.current
                ? `Keep your ${activity.current}-day streak going.`
                : "Make today a fresh start."}
            </p>
            <Progress
              value={(availability.week / 7) * 100}
              label="Weekly practice"
            />
            <Link href="/stats">
              View your progress <ArrowUpRight size={14} />
            </Link>
          </div>
          <nav aria-label="Account navigation">{nav(true)}</nav>
          <Link className="sidebar-user" href="/profile">
            <Avatar name={profile.name} />
            <span>
              <strong>{profile.name}</strong>
              <small>Personal workspace</small>
            </span>
          </Link>
        </div>
        <button
          className="collapse-button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </button>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="mobile-menu icon-button"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span className="muted hidden sm:inline">Workspace</span>
            <span className="muted hidden sm:inline">/</span>
            <span className="capitalize">{current}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="demo-label">
              <span />
              Demo workspace
            </span>
            <div className="notification-wrap">
              <button
                className="icon-button"
                aria-label="Notifications"
                aria-expanded={notifications}
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={18} />
                <i />
              </button>
              {notifications && (
                <div className="notification-panel">
                  <div className="flex justify-between">
                    <h3>You’re making progress</h3>
                    <button
                      aria-label="Close notifications"
                      onClick={() => setNotifications(false)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p>
                    Your React mastery is at 84%. Try a medium assessment next.
                  </p>
                  <Link
                    href="/assessments/react"
                    onClick={() => setNotifications(false)}
                  >
                    Explore React →
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="/settings"
              aria-label="Appearance settings"
              className="icon-button"
            >
              <Settings2 size={18} />
            </Link>
            <Link href="/profile" aria-label="Your profile">
              <Avatar name={profile.name} small />
            </Link>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {children}
        </main>
        <footer className="app-footer">
          <span>Lunaris · Make progress, with purpose.</span>
          <span>Frontend preview · September 2026</span>
        </footer>
      </div>
      <dialog
        ref={mobileDialog}
        className="mobile-overlay"
        aria-label="Workspace navigation"
        onCancel={() => setMobile(false)}
      >
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setMobile(false)}
        />
        <div className="mobile-drawer">
          <div className="flex items-center justify-between">
            <Link
              className="brand"
              href="/assessments"
              onClick={() => setMobile(false)}
            >
              <Orbit />
              lunaris.
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              onClick={() => setMobile(false)}
            >
              <X />
            </Button>
          </div>
          <nav aria-label="Mobile navigation">
            {nav()}
            {nav(true)}
          </nav>
          <p className="muted text-sm">Your next step starts here.</p>
        </div>
      </dialog>
    </div>
  )
}
