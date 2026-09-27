"use client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { usePreferences } from "@/features/settings/preferences"
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  ShieldCheck,
  Check,
  Zap,
  Trophy,
  LockKeyhole,
} from "lucide-react"
import {
  Badge,
  PageHeader,
  Panel,
  Metric,
  Progress,
} from "@/components/shared/ui"
import { PageEntrance } from "@/components/shared/motion"
import { LazyTrend } from "@/components/charts/lazy-trend"
import {
  useAttempts,
  attemptAvailability,
} from "@/features/history/use-attempts"
import { levels } from "../data/levels"
import type { Difficulty } from "../schemas/question"
import type { Topic } from "../types/assessment"
export function TopicDetail({ topic, count }: { topic: Topic; count: number }) {
  const attempts = useAttempts()
  const preferences = usePreferences()
  const recent = attempts.filter((a) => a.topic === topic.slug)
  const availability = attemptAvailability(attempts)
  return (
    <PageEntrance>
      <Link href="/assessments" className="text-link mb-7">
        <ArrowLeft size={15} />
        All assessments
      </Link>
      <PageHeader
        eyebrow={topic.category.toUpperCase()}
        title={topic.name}
        description={topic.description}
        action={
          <span
            className={`topic-icon tone-${topic.accent}`}
            style={{ width: 55, height: 55, fontSize: 23 }}
          >
            {topic.monogram}
          </span>
        }
      />
      <div className="two-column">
        <Panel>
          <div className="metric-grid">
            <Metric
              label="Topic mastery"
              value={`${topic.mastery}%`}
              note="Snapshot from your practice"
            />
            <Metric
              label="Best performance"
              value={
                recent.length
                  ? `${Math.max(...recent.map((a) => a.performance))}%`
                  : "—"
              }
            />
            <Metric
              label="Latest performance"
              value={recent.length ? `${recent[0].performance}%` : "—"}
            />
            <Metric label="Assessments" value={recent.length} />
          </div>
          <div className="mt-6">
            <Progress value={topic.mastery} label="Topic mastery" />
          </div>
        </Panel>
        <Panel>
          <h3>A clear picture of your progress</h3>
          <p className="muted mt-3 text-sm">
            {topic.available
              ? "Each level uses a short, curated demo set. Scores reflect your answers; ratings and mastery are illustrative until the API is connected."
              : "This question set is being prepared. Explore JavaScript, TypeScript, React, Next.js, or Communication in the meantime."}
          </p>
        </Panel>
      </div>
      <div className="section-heading section-space">
        <div>
          <h2>Choose a level</h2>
          <p className="muted mt-1 text-sm">
            Start where you are. Build from there.
          </p>
        </div>
        <Badge tone={availability.locked ? "amber" : "mint"}>
          {availability.locked
            ? "Next attempt: tomorrow"
            : "Today’s attempt available"}
        </Badge>
      </div>
      <div className="level-grid">
        {(Object.keys(levels) as Difficulty[]).map((key, index) => {
          const level = levels[key]
          return (
            <Panel
              key={key}
              className={`level-card ${key === preferences.difficulty ? "recommended" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="level-number">0{index + 1}</span>
                {key === preferences.difficulty && (
                  <Badge>YOUR PREFERENCE</Badge>
                )}
              </div>
              <div>
                <h3>{level.name}</h3>
                <p className="muted mt-2 text-xs">{level.description}</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span>{count} questions</span>
                <span className="flex items-center gap-1">
                  <Clock3 size={13} />
                  {level.seconds / 60} min
                </span>
              </div>
              <Separator />
              <ul>
                <li>
                  <Check size={14} />
                  Correct +{level.correct} · Wrong {level.wrong}
                </li>
                <li>
                  <Zap size={14} />
                  Up to {level.xp} XP · Best answer +{level.best}
                </li>
                <li>
                  <Trophy size={14} />
                  {level.ranked
                    ? key === "competitive"
                      ? "Higher rating impact · Ranked"
                      : "Standard rating impact · Ranked"
                    : "Practice only · No rating impact"}
                </li>
                <li>
                  <ShieldCheck size={14} />
                  {level.integrity}
                </li>
                <li>
                  <ArrowLeft size={14} />
                  {level.previous
                    ? "Review earlier questions"
                    : "Forward navigation only"}
                </li>
              </ul>
              {topic.available && !availability.locked ? (
                <Button
                  className="w-full"
                  nativeButton={false}
                  render={
                    <Link
                      href={`/assessments/${topic.slug}/take?level=${key}`}
                    />
                  }
                  variant={
                    key === preferences.difficulty ? "default" : "outline"
                  }
                >
                  Choose {level.name}
                  <ArrowRight size={14} />
                </Button>
              ) : (
                <Button variant="outline" disabled className="w-full">
                  <LockKeyhole size={14} />
                  {topic.available ? "Available tomorrow" : "Coming soon"}
                </Button>
              )}
            </Panel>
          )
        })}
      </div>
      <div className="subtle-banner section-space">
        <ShieldCheck size={18} />
        <p>
          One assessment per day, up to seven per week. {availability.week} used
          this week. Limits and scores are frontend demonstrations.
        </p>
      </div>
      {recent.length > 0 && (
        <div className="two-column section-space">
          <Panel>
            <h3>Performance over time</h3>
            <LazyTrend
              points={recent
                .slice()
                .reverse()
                .map((a) => ({
                  label: new Date(a.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  }),
                  value: a.performance,
                }))}
              label="Performance %"
              domain={[0, 100]}
            />
          </Panel>
          <Panel>
            <h3>Recent attempts</h3>
            {recent.slice(0, 4).map((a) => (
              <Link className="recent-row" href={`/results/${a.id}`} key={a.id}>
                <div>
                  <strong>{levels[a.difficulty].name}</strong>
                  <span>
                    {new Date(a.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </div>
                <Badge tone="mint">
                  {a.performance}% <ArrowRight size={11} />
                </Badge>
              </Link>
            ))}
          </Panel>
        </div>
      )}
    </PageEntrance>
  )
}
