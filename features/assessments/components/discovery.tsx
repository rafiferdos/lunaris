"use client"
import { activitySummary } from "@/features/stats/activity"
import { usePreferences } from "@/features/settings/preferences"
import { useState } from "react"
import Link from "next/link"
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
import { PageEntrance } from "@/components/shared/motion"
import { Button } from "@/components/ui/button"
import { useUrlFilters } from "@/hooks/use-url-filters"
import {
  useAttempts,
  attemptAvailability,
} from "@/features/history/use-attempts"
import { useProfile } from "@/features/profile/use-profile"
import { userBaseline } from "@/features/profile/profile-service"
import type { Topic } from "../types/assessment"
import { AssessmentCard } from "./assessment-card"
export function Discovery({ topics }: { topics: Topic[] }) {
  const filters = useUrlFilters()
  const [expanded, setExpanded] = useState(false)
  const attempts = useAttempts()
  const profile = useProfile()
  const activity = activitySummary(attempts)
  const preferences = usePreferences()
  const availability = attemptAvailability(attempts)
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
            ? attempts.some((a) => a.topic === topic.slug)
            : status === "unattempted"
              ? !attempts.some((a) => a.topic === topic.slug)
              : status === "completed"
                ? topic.mastery >= 80
                : topic.mastery < 80)) &&
        (difficulty === "all" || topic.available)
    )
    .sort((a, b) =>
      sort === "alphabetical"
        ? a.name.localeCompare(b.name)
        : sort === "progress"
          ? b.mastery - a.mastery
          : sort === "latest"
            ? Math.max(
                0,
                ...attempts
                  .filter((x) => x.topic === b.slug)
                  .map((x) => Date.parse(x.date))
              ) -
              Math.max(
                0,
                ...attempts
                  .filter((x) => x.topic === a.slug)
                  .map((x) => Date.parse(x.date))
              )
            : Number(b.available) - Number(a.available) ||
              Number(preferences.topics.includes(b.slug)) -
                Number(preferences.topics.includes(a.slug))
    )
  const rating =
    userBaseline.rating +
    attempts
      .filter((a) => a.id.startsWith("attempt-"))
      .reduce((sum, a) => sum + a.ratingChange, 0)
  return (
    <PageEntrance>
      <PageHeader
        eyebrow="A LITTLE BETTER, EVERY DAY"
        title={`Welcome back, ${profile.name.split(" ")[0]}.`}
        description="Make time for your next breakthrough. Where will you focus today?"
        action={
          <Link href="/stats" className="outline-link">
            View my progress <ArrowUpRight size={15} />
          </Link>
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
            <span className="positive ml-3 text-xs">↗ 64 this month</span>
          </div>
        </div>
        <div>
          <span className="overview-icon">
            <Trophy size={19} />
          </span>
          <div>
            <p className="muted text-xs">Global rank</p>
            <strong>#128</strong>
            <span className="muted ml-3 text-xs">Top 8%</span>
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
                ? "Today’s attempt complete · Next: tomorrow"
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
          <div className="category-tabs" aria-label="Assessment categories">
            {["All assessments", "Technical", "Interpersonal"].map((name) => (
              <button
                key={name}
                aria-pressed={category === name}
                className={category === name ? "selected" : ""}
                onClick={() => filters.set({ category: name })}
              >
                {name}
                <span>
                  {name === "All assessments"
                    ? topics.length
                    : topics.filter((t) => t.category === name).length}
                </span>
              </button>
            ))}
          </div>
          <div className="filter-toolbar">
            <label className="search-field">
              <Search size={17} />
              <input
                aria-label="Search assessments"
                placeholder="Search a skill or topic…"
                value={query}
                onChange={(e) => filters.set({ q: e.target.value })}
              />
            </label>
            <Button
              variant="outline"
              className="filter-button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
              <SlidersHorizontal />
              Filters
              {status !== "all" || difficulty !== "all" ? (
                <span className="filter-dot" />
              ) : null}
            </Button>
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
          {expanded && (
            <div className="expanded-filters">
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
            </div>
          )}
          <div className="assessment-grid">
            {visible.map((topic) => (
              <AssessmentCard
                key={topic.slug}
                topic={topic}
                attempts={attempts.filter((a) => a.topic === topic.slug).length}
              />
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
              Good at React.
              <br />
              Ready for better?
            </h3>
            <p>
              You’re at 84% mastery. Try Medium to put your understanding to
              work.
            </p>
            <Link href="/assessments/react" className="primary-link">
              Continue React <ArrowRight size={16} />
            </Link>
            <div className="recommendation-foot">
              <span>5 questions</span>
              <span>8 minutes</span>
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
                ? "Next attempt available tomorrow"
                : "You have an attempt available today"}
            </div>
          </section>
          <section className="aside-section">
            <h3>Recently completed</h3>
            {attempts.slice(0, 2).map((attempt) => (
              <Link
                key={attempt.id}
                className="recent-row"
                href={`/results/${attempt.id}`}
              >
                <div>
                  <strong>{attempt.topicName}</strong>
                  <span>
                    {attempt.difficulty} ·{" "}
                    {new Date(attempt.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
                <Badge tone="mint">{attempt.performance}%</Badge>
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
