"use client"
import { useQueries } from "@tanstack/react-query"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  PageHeader,
  Panel,
  Metric,
  Progress,
  EmptyState,
} from "@/components/shared/ui"
import { QueryState } from "@/components/shared/query-state"
import { LazyTrend } from "@/components/charts/lazy-trend"
import { useWorkspace } from "@/features/workspace/workspace-provider"
import { useSession } from "@/features/auth/auth-boundary"
import { queries } from "@/lib/api/queries"
import { percent, dateTime } from "@/lib/format"
export function StatsPage() {
  const { overview: o, activity } = useWorkspace(),
    { user } = useSession()
  const [performance, topics] = useQueries({
    queries: [queries.performance(user.id), queries.topics(user.id)],
  })
  return (
    <>
      <PageHeader
        eyebrow="THE BIGGER PICTURE"
        title="Your effort, made visible."
        description="Results and progress from your completed assessments."
      />
      <Tabs defaultValue="overview">
        <TabsList variant="line" className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="metric-grid">
            <Panel>
              <Metric
                label="Current rating"
                value={o.rating}
                note={
                  o.rank
                    ? `Global rank #${o.rank}`
                    : "Complete an eligible assessment to rank"
                }
              />
            </Panel>
            <Panel>
              <Metric
                label="Objective accuracy"
                value={percent(o.accuracyPercent)}
                note={`${o.questionsAnswered} questions answered`}
              />
            </Panel>
            <Panel>
              <Metric
                label="Total XP"
                value={o.totalXp}
                note={`${o.assessmentCount} completed assessments`}
              />
            </Panel>
            <Panel>
              <Metric
                label="Current streak"
                value={`${o.currentStreak} days`}
                note={`Best: ${o.longestStreak} days`}
              />
            </Panel>
          </div>
          <div className="two-column section-space">
            <Panel>
              <h3>Overall rating history</h3>
              {performance.data ? (
                performance.data.ratingHistory.length ? (
                  <LazyTrend
                    points={performance.data.ratingHistory.map((p) => ({
                      label: new Date(p.at).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      }),
                      value: p.rating,
                    }))}
                    label="Rating"
                  />
                ) : (
                  <EmptyState
                    title="Your story starts here"
                    description="Complete an assessment to see your rating history."
                  />
                )
              ) : (
                <QueryState
                  error={performance.error}
                  retry={performance.refetch}
                />
              )}
            </Panel>
            <Panel>
              <h3>Assessment quality</h3>
              <div className="metric-grid mt-6">
                <Metric
                  label="Normalized performance"
                  value={percent(o.averageNormalizedScore)}
                />
                <Metric
                  label="Weighted answer quality"
                  value={percent(o.answerQualityPercent)}
                />
                <Metric label="Integrity" value={percent(o.averageIntegrity)} />
                <Metric label="Best performance" value={percent(o.bestScore)} />
              </div>
            </Panel>
          </div>
          {performance.data && (
            <Panel className="section-space">
              <h3>Performance by category and mode</h3>
              {performance.data.groups.map((g) => (
                <div className="recent-row" key={`${g.category}:${g.mode}`}>
                  <div>
                    <strong>
                      {g.category} · {g.mode}
                    </strong>
                    <span>{g.count} assessments</span>
                  </div>
                  <span>{percent(g.performance)} performance</span>
                </div>
              ))}
            </Panel>
          )}
        </TabsContent>
        <TabsContent value="skills">
          {topics.data ? (
            topics.data.length ? (
              <div className="assessment-grid">
                {topics.data.map((t) => (
                  <Panel key={t.topic}>
                    <Link
                      className="text-link"
                      href={`/assessments/${t.topic}`}
                    >
                      {t.name}
                    </Link>
                    <div className="mt-4">
                      <Progress value={t.mastery} label={`${t.name} mastery`} />
                    </div>
                    <div className="metric-grid mt-5">
                      <Metric label="Mastery" value={percent(t.mastery)} />
                      <Metric label="Topic rating" value={t.rating} />
                      <Metric label="Assessments" value={t.assessmentCount} />
                      <Metric
                        label="Accuracy"
                        value={percent(t.accuracyPercent)}
                      />
                    </div>
                  </Panel>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No skill results yet"
                description="Choose your first assessment to start building your profile."
              />
            )
          ) : (
            <QueryState error={topics.error} retry={topics.refetch} />
          )}
        </TabsContent>
        <TabsContent value="activity">
          <Panel>
            <h3>Activity · UTC</h3>
            <p className="muted mt-2">
              {activity.days.length} active days in the last 365 days.
            </p>
            {activity.days.length ? (
              activity.days
                .slice()
                .reverse()
                .map((d) => (
                  <div className="recent-row" key={d.date}>
                    <span>{dateTime(d.date)}</span>
                    <strong>{d.count} completed</strong>
                  </div>
                ))
            ) : (
              <EmptyState
                title="Make today your first day"
                description="Completed assessments appear in your activity."
              />
            )}
          </Panel>
        </TabsContent>
      </Tabs>
    </>
  )
}
