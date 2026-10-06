"use client"
import Link from "@/components/shared/app-link"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, Clock3, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  PageHeader,
  Panel,
  Metric,
  Badge,
  Progress,
  EmptyState,
} from "@/components/shared/ui"
import { QueryState } from "@/components/shared/query-state"
import { PageEntrance } from "@/components/shared/motion"
import { useSession } from "@/features/auth/auth-boundary"
import { queries } from "@/lib/api/queries"
import { modeLabels } from "../services/assessment-service"
import { usePreferences } from "@/features/settings/preferences"
import { percent, dateTime } from "@/lib/format"
export function TopicDetail({ slug }: { slug: string }) {
  const { user } = useSession(),
    preferences = usePreferences()
  const history = useQuery(queries.history(user.id, { topic: slug, limit: 5 }))
  const catalog = useQuery(queries.assessments(user.id))
  if (!catalog.data)
    return <QueryState error={catalog.error} retry={catalog.refetch} />
  const topic = catalog.data.find((a) => a.slug === slug)
  if (!topic)
    return (
      <EmptyState
        title="Assessment not found"
        description="Choose an available topic from the catalog."
      />
    )
  const quota = topic.availability
  return (
    <PageEntrance>
      <Link href="/assessments" className="text-link mb-7">
        <ArrowLeft size={15} />
        All assessments
      </Link>
      <PageHeader
        eyebrow={topic.category}
        title={topic.name}
        description={topic.description}
      />
      <Panel>
        <div className="metric-grid">
          <Metric
            label="Topic mastery"
            value={percent(topic.progress?.averageNormalizedScore)}
          />
          <Metric
            label="Best performance"
            value={percent(topic.progress?.bestScore)}
          />
          <Metric
            label="Assessments"
            value={topic.progress?.assessmentCount ?? 0}
          />
          <Metric label="Topic rating" value={topic.progress?.rating ?? 1000} />
        </div>
        <div className="mt-6">
          <Progress
            value={topic.progress?.averageNormalizedScore ?? 0}
            label="Topic mastery"
          />
        </div>
      </Panel>
      <div className="section-heading section-space">
        <h2>Choose a level</h2>
        <Badge tone={quota.canStart ? "mint" : "amber"}>
          {quota.canStart ? "Attempt available" : "Quota used"}
        </Badge>
      </div>
      <div className="level-grid">
        {topic.modes.map((mode, i) => (
          <Panel
            key={mode.id}
            className={`level-card ${mode.mode.toLowerCase() === preferences.difficulty ? "recommended" : ""}`}
          >
            <span className="level-number">0{i + 1}</span>
            <h3>{modeLabels[mode.mode]}</h3>
            <div className="flex gap-4 text-xs">
              <span>{mode.questionCount} questions</span>
              <span className="flex gap-1">
                <Clock3 size={13} />
                {Math.round(mode.durationSeconds / 60)} min
              </span>
            </div>
            <ul>
              <li>
                Correct +{mode.scoring.CORRECT} · Partial +
                {mode.scoring.PARTIAL} · Wrong {mode.scoring.WRONG}
              </li>
              <li>Best weighted answer +{mode.scoring.BEST}</li>
              <li>
                {mode.ranked
                  ? "Earn XP and build your rating"
                  : "Practice without ranking"}
              </li>
              <li>
                {mode.backNavigation
                  ? "Review earlier questions"
                  : "Forward navigation only"}
              </li>
              <li>
                {mode.mode === "COMPETITIVE"
                  ? "Leaving the tab immediately submits your answers."
                  : "Focus signals contribute to integrity."}
              </li>
            </ul>
            {mode.available && quota.canStart ? (
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={`/assessments/${slug}/take?level=${mode.mode.toLowerCase()}`}
                  />
                }
              >
                Choose {modeLabels[mode.mode]}
                <ArrowRight />
              </Button>
            ) : (
              <Button disabled variant="outline">
                {!mode.available ? "Question set unavailable" : "Quota used"}
              </Button>
            )}
          </Panel>
        ))}
      </div>
      <div className="subtle-banner section-space">
        <ShieldCheck size={18} />
        <p>
          {quota.dailyUsed}/{quota.dailyLimit} starts today · {quota.weeklyUsed}
          /{quota.weeklyLimit} this week. Starting consumes an attempt. Daily
          reset: {dateTime(quota.nextDailyReset)}; weekly reset:{" "}
          {dateTime(quota.nextWeeklyReset)}.
        </p>
      </div>
      <Panel className="section-space">
        <h3>Recent attempts</h3>
        {history.isPending || history.error ? (
          <QueryState error={history.error} retry={history.refetch} />
        ) : history.data.data.length ? (
          history.data.data.map((a) => (
            <Link
              key={a.id}
              className="recent-row"
              href={
                a.status === "IN_PROGRESS"
                  ? `/assessments/${slug}/take?attempt=${a.id}`
                  : `/results/${a.id}`
              }
            >
              <div>
                <strong>{modeLabels[a.mode]}</strong>
                <span>{dateTime(a.date)}</span>
              </div>
              <Badge>
                {a.status === "IN_PROGRESS"
                  ? "Resume"
                  : percent(a.normalizedScore)}
              </Badge>
            </Link>
          ))
        ) : (
          <p className="muted mt-4">Your first assessment will appear here.</p>
        )}
      </Panel>
    </PageEntrance>
  )
}
