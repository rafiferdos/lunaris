"use client"
import { useState } from "react"
import Link from "@/components/shared/app-link"
import { usePathname } from "next/navigation"
import {
  Orbit,
  LayoutGrid,
  Trophy,
  ChartNoAxesCombined,
  History,
  UserRound,
  Settings2,
  Bell,
  X,
  ArrowUpRight,
  Flame,
} from "lucide-react"
import { Avatar, Progress } from "@/components/shared/ui"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover"
import { useAvailability } from "@/features/history/use-attempts"
import { useQuery } from "@tanstack/react-query"
import { queries } from "@/lib/api/queries"
import { useSignOut } from "@/features/auth/auth-boundary"
import { MutationError } from "@/components/shared/query-state"
import { useProfile } from "@/features/profile/use-profile"
const navigation = [
  { href: "/assessments", label: "Assessments", icon: LayoutGrid },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/stats", label: "My Stats", icon: ChartNoAxesCombined },
  { href: "/history", label: "History", icon: History },
]
const accountNavigation = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings2 },
]
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delay={250}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "15rem",
            "--sidebar-width-icon": "3.5rem",
          } as React.CSSProperties
        }
      >
        <WorkspaceShell>{children}</WorkspaceShell>
      </SidebarProvider>
    </TooltipProvider>
  )
}
function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { state, isMobile, setOpenMobile } = useSidebar()
  const [notifications, setNotifications] = useState(false)
  const profile = useProfile()
  const activityQuery = useQuery(queries.activity(profile.id)),
    catalog = useQuery(queries.assessments(profile.id))
  const signOut = useSignOut()
  const availability = useAvailability()
  const collapsed = state === "collapsed" && !isMobile
  const current =
    [...navigation, ...accountNavigation].find((n) =>
      pathname.startsWith(n.href)
    )?.label ??
    (pathname.startsWith("/results")
      ? "Assessment results"
      : pathname.endsWith("/import")
        ? "Question import"
        : "Question bank")
  function menu(items: typeof navigation) {
    return (
      <SidebarMenu>
        {items.map(({ href, label, icon: Icon }) => (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              render={<Link href={href} />}
              tooltip={label}
              isActive={pathname.startsWith(href)}
              aria-current={pathname.startsWith(href) ? "page" : undefined}
              onClick={() => setOpenMobile(false)}
              className="h-10"
            >
              <Icon />
              <span>{label}</span>
            </SidebarMenuButton>
            {label === "Assessments" && catalog.data && (
              <SidebarMenuBadge>{catalog.data?.length}</SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    )
  }
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar collapsible="icon">
        <SidebarHeader className="px-2 pt-7 pb-5">
          <div className="flex items-center justify-between">
            <Link
              href="/assessments"
              aria-label="Lunaris assessments"
              className="flex min-w-0 items-center gap-2 px-2 text-2xl font-medium tracking-tight"
              onClick={() => setOpenMobile(false)}
            >
              <Orbit size={26} strokeWidth={1.5} />
              {!collapsed && (
                <span>
                  lunaris<span className="muted">.</span>
                </span>
              )}
            </Link>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setOpenMobile(false)}
              >
                <X />
              </Button>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>WORKSPACE</SidebarGroupLabel>
            <nav aria-label="Main navigation">{menu(navigation)}</nav>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          {!collapsed && (
            <div className="practice-note !mb-2">
              <div className="flex items-center gap-2">
                <Flame size={17} />
                <strong>A little, every day.</strong>
              </div>
              <p>
                Consistency is a skill, too.
                <br />
                {activityQuery.data?.currentStreak
                  ? `Keep your ${activityQuery.data.currentStreak}-day streak going.`
                  : "Make today a fresh start."}
              </p>
              <Progress
                value={(availability.week / availability.weeklyLimit) * 100}
                label="Weekly practice"
              />
              <Link href="/stats" onClick={() => setOpenMobile(false)}>
                View your progress <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
          <nav aria-label="Account navigation">{menu(accountNavigation)}</nav>
          {profile.role === "ADMIN" && (
            <Link href="/admin/questions" className="text-link px-4 py-2">
              Question import
            </Link>
          )}
          <Button
            variant="ghost"
            disabled={signOut.isPending}
            onClick={() => signOut.mutate()}
          >
            Sign out
          </Button>
          <MutationError error={signOut.error} />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/profile" />}
                size="lg"
                tooltip={profile.name}
                onClick={() => setOpenMobile(false)}
              >
                <Avatar name={profile.name} small />
                {!collapsed && (
                  <span className="min-w-0">
                    <strong className="block truncate text-xs">
                      {profile.name}
                    </strong>
                    <small className="muted text-[10px]">
                      Personal workspace
                    </small>
                  </span>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <div className="min-w-0 flex-1">
        <header className="topbar">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger
              aria-label={
                isMobile
                  ? "Open navigation"
                  : collapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
            />
            <span className="muted hidden sm:inline">Workspace</span>
            <span className="muted hidden sm:inline">/</span>
            <span className="truncate">{current}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="demo-label">
              <span />
              Personal workspace
            </span>
            <Popover open={notifications} onOpenChange={setNotifications}>
              <PopoverTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Notifications"
                  />
                }
              >
                <Bell size={18} />
              </PopoverTrigger>
              <PopoverContent align="end" className="max-w-[calc(100vw-2rem)]">
                <div className="flex items-center justify-between gap-3">
                  <PopoverTitle>You’re making progress</PopoverTitle>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Close notifications"
                    onClick={() => setNotifications(false)}
                  >
                    <X />
                  </Button>
                </div>
                <PopoverDescription>
                  {!availability.loaded
                    ? "Assessment availability could not be loaded yet."
                    : availability.locked
                      ? "Your quota is used. Check assessment availability for the next UTC reset."
                      : "You can start an assessment today."}
                </PopoverDescription>
                <Button
                  variant="link"
                  nativeButton={false}
                  render={<Link href="/assessments/react" />}
                  onClick={() => setNotifications(false)}
                >
                  Explore React <ArrowUpRight />
                </Button>
              </PopoverContent>
            </Popover>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    nativeButton={false}
                    render={<Link href="/settings" />}
                    variant="ghost"
                    size="icon"
                    aria-label="Appearance settings"
                  />
                }
              >
                <Settings2 size={18} />
              </TooltipTrigger>
              <TooltipContent>Appearance settings</TooltipContent>
            </Tooltip>
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
          <span>Progress, saved to your account</span>
        </footer>
      </div>
    </>
  )
}
