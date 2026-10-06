"use client"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { activitySummary } from "@/features/stats/activity"
import { usePreferences } from "@/features/settings/preferences"
import { useState } from "react"
import Link from "@/components/shared/app-link"
import {
  Search,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  Trophy,
  Flame,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react"
import {
  PageHeader,
  Badge,
  Progress,
  EmptyState,
  Select,
  TextLink,
} from "@/components/shared/ui"
import { PageEntrance, Reveal } from "@/components/shared/motion"
import { Button } from "@/components/ui/button"
import { useUrlFilters } from "@/hooks/use-url-filters"
import {
  useRecentAttempts,
  useAvailability,
} from "@/features/history/use-attempts"
import { useProfile } from "@/features/profile/use-profile"
import { useQueries } from "@tanstack/react-query"
import { useSession } from "@/features/auth/auth-boundary"
import { queries } from "@/lib/api/queries"
import { QueryState } from "@/components/shared/query-state"
import type { Assessment, Overview, GetResponse } from "@/lib/api/types"
import { topicView } from "../services/assessment-service"
import { AssessmentCard } from "./assessment-card"
export function Discovery() {
  const { user } = useSession()
  const [catalog, overview, activity] = useQueries({
    queries: [
      queries.assessments(user.id),
      queries.overview(user.id),
      queries.activity(user.id),
    ],
  })
  if (!catalog.data || !overview.data || !activity.data)
    return (
      <QueryState
        error={[catalog, overview, activity].find((q) => q.error)?.error}
        retry={() =>
          Promise.all([catalog, overview, activity].map((q) => q.refetch()))
        }
      />
    )
  return (
    <DiscoveryContent
      assessments={catalog.data}
      overview={overview.data}
      activityData={activity.data}
    />
  )
}
function DiscoveryContent({
  assessments,
  overview,
  activityData,
}: {
  assessments: Assessment[]
  overview: Overview
  activityData: GetResponse<"/api/v1/stats/activity">["data"]
}) {
  const topics = assessments.map(topicView)
  const recommended = assessments.find((topic) => topic.slug === "react")
  const recommendedMode = recommended?.modes.find(
    (mode) => mode.mode === "MEDIUM" && mode.available
  )

  const filters = useUrlFilters()
  const [expanded, setExpanded] = useState(false)
  const recentQuery = useRecentAttempts()
  const attempts = recentQuery.data?.data ?? []
  const profile = useProfile()
  const activity = activitySummary(activityData)
  const preferences = usePreferences()
  const availability = useAvailability()
  const category = filters.get("category", "All assessments")
  const query = filters.get("q")
  const status = filters.get("status", "all")
  const sort = filters.get("sort", "recommended")
  const difficulty = filters.get("difficulty", "all")
  const visible = topics
    .filter(
      (topic) =>
        (category === "All assessments" || topic.category === category) &&
        `${topic.name} ${topic.description}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (status === "all" ||
          (status === "attempted"
            ? !!assessments.find((a) => a.slug === topic.slug)?.progress
                ?.assessmentCount
            : status === "unattempted"
              ? !assessments.find((a) => a.slug === topic.slug)?.progress
                  ?.assessmentCount
              : status === "completed"
                ? topic.mastery >= 80
                : topic.mastery < 80)) &&
        (difficulty === "all" ||
          assessments
            .find((a) => a.slug === topic.slug)
            ?.modes.some(
              (m) => m.mode.toLowerCase() === difficulty && m.available
            ))
    )
    .sort((a, b) =>
      sort === "alphabetical"
        ? a.name.localeCompare(b.name)
        : sort === "progress"
          ? b.mastery - a.mastery
          : sort === "latest"
            ? Date.parse(
                assessments.find((t) => t.slug === b.slug)?.progress
                  ?.lastAssessmentAt ?? "1970-01-01"
              ) -
              Date.parse(
                assessments.find((t) => t.slug === a.slug)?.progress
                  ?.lastAssessmentAt ?? "1970-01-01"
              )
            : Number(b.available) - Number(a.available) ||
              Number(preferences.topics.includes(b.slug)) -
                Number(preferences.topics.includes(a.slug))
    )
  const rating = overview.rating
  return (
    <PageEntrance>
      <PageHeader
        eyebrow="A LITTLE BETTER, EVERY DAY"
        title={`Welcome back, ${profile.name.split(" ")[0]}.`}
        description="Make time for your next breakthrough. Where will you focus today?"
        action={
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/stats" />}
          >
            View my progress <ArrowUpRight size={15} />
          </Button>
        }
      />
      <section className="overview-strip" aria-label="Your overview">
        <div>
          <span className="overview-icon">
            <TrendingUp size={19} />
          </span>
          <div>
            <p className="muted text-xs">Your rating</p>
            <strong>{rating.toLocaleString()}</strong>
          </div>
        </div>
        <div>
          <span className="overview-icon">
            <Trophy size={19} />
          </span>
          <div>
            <p className="muted text-xs">Global rank</p>
            <strong>{overview.rank ? `#${overview.rank}` : "Unranked"}</strong>
          </div>
        </div>
        <div>
          <span className="overview-icon">
            <Flame size={19} />
          </span>
          <div>
            <p className="muted text-xs">Current streak</p>
            <strong>
              {activity.current} <small>days</small>
            </strong>
            <span className="muted ml-3 text-xs">Keep it going</span>
          </div>
        </div>
        <div>
          <div className="w-full">
            <div className="mb-2 flex justify-between">
              <p className="muted text-xs">This week</p>
              <span className="text-xs font-medium">
                {availability.week} / 7 attempts
              </span>
            </div>
            <Progress
              value={(availability.week / 7) * 100}
              label="Weekly attempts"
            />
            <p className="muted mt-2 text-xs">
              {availability.usedToday
                ? "Today’s quota used · Resets at 00:00 UTC"
                : `${7 - availability.week} attempts left this week`}
            </p>
          </div>
        </div>
      </section>
      <div className="discovery-layout">
        <div className="min-w-0">
          <div className="section-heading">
            <div>
              <h2>Explore assessments</h2>
              <p className="muted mt-1 text-sm">
                Build your skills. Measure what matters.
              </p>
            </div>
            <span className="muted text-xs">
              {topics.length} topics to explore
            </span>
          </div>
          <ToggleGroup
            className="mb-5 max-w-full flex-wrap"
            aria-label="Assessment categories"
            value={[category]}
            onValueChange={(values) => {
              if (values[0]) filters.set({ category: values[0] })
            }}
          >
            {["All assessments", "Technical", "Interpersonal"].map((name) => (
              <ToggleGroupItem key={name} value={name}>
                {name}
                <span>
                  {name === "All assessments"
                    ? topics.length
                    : topics.filter((t) => t.category === name).length}
                </span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <div className="filter-toolbar">
              <Label className="search-field">
                <Search size={17} />
                <Input
                  aria-label="Search assessments"
                  placeholder="Search a skill or topic…"
                  value={query}
                  onChange={(e) => filters.set({ q: e.target.value })}
                />
              </Label>
              <CollapsibleTrigger
                render={<Button variant="outline" className="filter-button" />}
              >
                <SlidersHorizontal />
                Filters
                {status !== "all" || difficulty !== "all" ? (
                  <span className="filter-dot" />
                ) : null}
              </CollapsibleTrigger>
              <Select
                label="Sort assessments"
                value={sort}
                onChange={(value) => filters.set({ sort: value })}
                options={[
                  { value: "recommended", label: "Recommended" },
                  { value: "progress", label: "Most progress" },
                  { value: "latest", label: "Recently attempted" },
                  { value: "alphabetical", label: "A to Z" },
                ]}
              />
            </div>
            <CollapsibleContent className="expanded-filters">
              <Select
                label="Completion status"
                value={status}
                onChange={(value) => filters.set({ status: value })}
                options={[
                  { value: "all", label: "Any progress" },
                  { value: "attempted", label: "Attempted" },
                  { value: "unattempted", label: "Never attempted" },
                  { value: "completed", label: "Mastered (80%+)" },
                  { value: "incomplete", label: "Not mastered" },
                ]}
              />
              <Select
                label="Difficulty"
                value={difficulty}
                onChange={(value) => filters.set({ difficulty: value })}
                options={[
                  { value: "all", label: "Any difficulty" },
                  "easy",
                  "medium",
                  "competitive",
                ]}
              />
              <Button
                variant="ghost"
                onClick={() =>
                  filters.set({
                    status: "",
                    difficulty: "",
                    q: "",
                    category: "",
                  })
                }
              >
                Clear filters
              </Button>
            </CollapsibleContent>
          </Collapsible>
          <div className="assessment-grid">
            {visible.map((topic, index) => (
              <Reveal key={topic.slug} index={index}>
                <AssessmentCard
                  topic={topic}
                  attempts={
                    assessments.find((a) => a.slug === topic.slug)?.progress
                      ?.assessmentCount ?? 0
                  }
                />
              </Reveal>
            ))}
          </div>
          {!visible.length && (
            <EmptyState>
              <Button
                variant="outline"
                onClick={() =>
                  filters.set({
                    q: "",
                    status: "",
                    category: "",
                    difficulty: "",
                  })
                }
              >
                Clear filters
              </Button>
            </EmptyState>
          )}
          <p className="muted mt-5 text-xs">
            Showing {visible.length} topics · New question sets are added over
            time.
          </p>
        </div>
        <aside className="discovery-aside">
          <section className="recommendation">
            <div className="eyebrow flex items-center gap-2">
              <Sparkles size={13} />
              YOUR NEXT STEP
            </div>
            <span className="recommendation-mark">
              Re<span>↗</span>
            </span>
            <h3>
              Explore React.
              <br />
              Ready to practice?
            </h3>
            <p>Choose a level and put your understanding to work.</p>
            <Button
              variant="default"
              nativeButton={false}
              render={<Link href="/assessments/react" />}
            >
              Continue React <ArrowRight size={16} />
            </Button>
            <div className="recommendation-foot">
              <span>
                {recommendedMode
                  ? `${recommendedMode.questionCount} questions`
                  : "Choose a level"}
              </span>
              <span>
                {recommendedMode
                  ? `${Math.ceil(recommendedMode.durationSeconds / 60)} minutes`
                  : "Available levels"}
              </span>
            </div>
          </section>
          <section className="aside-section">
            <div className="flex items-center justify-between">
              <h3>Your weekly rhythm</h3>
              <Flame size={16} className="muted" />
            </div>
            <p className="muted mt-2 text-sm">Small steps. Lasting progress.</p>
            <div className="week-days">
              {activity.week.map((day, i) => (
                <div key={i}>
                  <span>{day.label}</span>
                  <b className={day.done ? "done" : day.today ? "today" : ""}>
                    {day.done ? (
                      <CheckCircle2 size={16} />
                    ) : day.today ? (
                      day.day
                    ) : (
                      "·"
                    )}
                  </b>
                </div>
              ))}
            </div>
            <div className="availability">
              <span className="status-dot" />
              {availability.locked
                ? "Attempt quota currently used"
                : "You have an attempt available today"}
            </div>
          </section>
          <section className="aside-section">
            <h3>Recently completed</h3>
            {attempts.slice(0, 2).map((attempt) => (
              <Link
                key={attempt.id}
                className="recent-row"
                href={
                  attempt.status === "IN_PROGRESS"
                    ? `/assessments/${attempt.topic}/take?attempt=${attempt.id}`
                    : `/results/${attempt.id}`
                }
              >
                <div>
                  <strong>{attempt.topicName}</strong>
                  <span>
                    {attempt.mode.toLowerCase()} ·{" "}
                    {new Date(attempt.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
                <Badge tone="mint">
                  {attempt.status === "IN_PROGRESS"
                    ? "Resume"
                    : `${Math.round(attempt.normalizedScore ?? 0)}%`}
                </Badge>
              </Link>
            ))}
            <TextLink href="/history">View all activity</TextLink>
          </section>
          <div className="quiet-note">
            <OrbitMotif />
            <p>
              Progress isn’t always a straight line.
              <br />
              Showing up is a good start.
            </p>
          </div>
        </aside>
      </div>
    </PageEntrance>
  )
}
function OrbitMotif() {
  return (
    <svg width="46" height="36" viewBox="0 0 46 36" aria-hidden="true">
      <ellipse
        cx="23"
        cy="18"
        rx="20"
        ry="9"
        transform="rotate(-30 23 18)"
        fill="none"
        stroke="currentColor"
      />
      <circle cx="23" cy="18" r="6" fill="none" stroke="currentColor" />
      <circle cx="39" cy="7" r="2" fill="currentColor" />
    </svg>
  )
}
