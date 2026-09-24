"use client"
import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, TrendingUp, Flame } from "lucide-react"
import {
  PageHeader,
  Panel,
  Metric,
  Progress,
  Badge,
} from "@/components/shared/ui"
import { PageEntrance } from "@/components/shared/motion"
import { LazyTrend } from "@/components/charts/lazy-trend"
import { useAttempts } from "@/features/history/use-attempts"
import type { Topic } from "@/features/assessments/types/assessment"
import { statsService } from "./stats-service"
export function StatsPage({ topics }: { topics: Topic[] }) {
  const attempts = useAttempts()
  const overview = statsService.getOverview(attempts)
  const [tab, setTab] = useState("Overview")
  const [period, setPeriod] = useState("3 months")
  const skills = topics
    .filter((t) => t.mastery > 0)
    .sort((a, b) => b.mastery - a.mastery)
  const trend =
    period === "This month"
      ? statsService.ratingHistory.slice(-2)
      : statsService.ratingHistory
  return (
    <PageEntrance>
      <PageHeader
        eyebrow="THE BIGGER PICTURE"
        title="Your effort, made visible."
        description="Understand your strengths. Give your next step a little direction."
        action={
          <Badge tone="mint">
            <TrendingUp size={13} />
            +64 rating this month
          </Badge>
        }
      />
      <div className="category-tabs">
        {["Overview", "Skills", "Activity"].map((value) => (
          <button
            key={value}
            className={tab === value ? "selected" : ""}
            aria-pressed={tab === value}
            onClick={() => setTab(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {tab === "Overview" && (
        <>
          <div className="metric-grid">
            <Panel>
              <Metric
                label="Current rating"
                value={overview.rating.toLocaleString()}
                note="Global rank #128 · Top 8%"
              />
            </Panel>
            <Panel>
              <Metric
                label="Average accuracy"
                value={`${overview.accuracy}%`}
                note={`${overview.questions} questions answered`}
              />
            </Panel>
            <Panel>
              <Metric
                label="Total experience"
                value={overview.xp.toLocaleString()}
                note={`${overview.completed} assessments completed`}
              />
            </Panel>
            <Panel>
              <Metric
                label="Current streak"
                value={`${overview.activity.current} days`}
                note={`Personal best: ${overview.activity.longest} days`}
              />
            </Panel>
          </div>
          <div className="two-column section-space">
            <Panel>
              <div className="panel-title">
                <h3>Rating over time</h3>
                <div className="segmented">
                  {["This month", "3 months"].map((value) => (
                    <button
                      key={value}
                      aria-pressed={period === value}
                      onClick={() => setPeriod(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <LazyTrend
                points={trend.map((point, index) =>
                  index === trend.length - 1
                    ? { ...point, value: overview.rating }
                    : point
                )}
                label="Rating"
              />
            </Panel>
            <Panel>
              <h3>A balanced skill set</h3>
              <p className="muted mt-2 text-xs">
                Average performance by category
              </p>
              {[
                { name: "Technical", value: overview.technical },
                { name: "Interpersonal", value: overview.interpersonal },
              ].map((category) => (
                <div key={category.name} className="skill-row mt-3">
                  <div className="flex justify-between text-sm">
                    <span>{category.name}</span>
                    <strong>{category.value}%</strong>
                  </div>
                  <Progress value={category.value} label={category.name} />
                </div>
              ))}
              <div className="subtle-banner mt-6">
                <TrendingUp size={17} />
                <p>
                  Your React mastery is 84%. Communication is a useful next
                  focus.
                </p>
              </div>
            </Panel>
          </div>
          <div className="two-column section-space">
            <Panel>
              <div className="panel-title">
                <h3>Your strongest skills</h3>
                <Link href="/assessments" className="text-link">
                  Explore
                  <ArrowUpRight size={14} />
                </Link>
              </div>
              {skills.slice(0, 4).map((topic) => (
                <div className="skill-row" key={topic.slug}>
                  <div className="flex justify-between text-sm">
                    <Link href={`/assessments/${topic.slug}`}>
                      {topic.name}
                    </Link>
                    <span>{topic.mastery}%</span>
                  </div>
                  <Progress value={topic.mastery} label={topic.name} />
                </div>
              ))}
            </Panel>
            <Panel>
              <h3>The details that matter</h3>
              <div className="metric-grid mt-6 !grid-cols-2 gap-y-7">
                <Metric
                  label="Average performance"
                  value={`${overview.performance}%`}
                />
                <Metric
                  label="Average integrity"
                  value={`${overview.integrity}%`}
                />
                <Metric
                  label="Response time"
                  value={`${overview.responseTime}s`}
                />
                <Metric
                  label="Completion"
                  value="100%"
                  note="All saved attempts submitted"
                />
              </div>
            </Panel>
          </div>
        </>
      )}
      {tab === "Skills" && (
        <div className="two-column">
          <Panel>
            <h3>Skill mastery</h3>
            <p className="muted mt-2 text-xs">
              Curated mastery snapshot · Updated by the future scoring API
            </p>
            {skills.map((topic) => (
              <div key={topic.slug} className="skill-row">
                <div className="flex justify-between">
                  <Link href={`/assessments/${topic.slug}`}>{topic.name}</Link>
                  <Badge>
                    {topic.mastery >= 80
                      ? "Strongest"
                      : topic.mastery < 50
                        ? "Needs practice"
                        : "Building confidence"}
                  </Badge>
                </div>
                <Progress value={topic.mastery} label={topic.name} />
              </div>
            ))}
          </Panel>
          <Panel>
            <h3>Performance by level</h3>
            {["easy", "medium", "competitive"].map((level) => {
              const matching = attempts.filter((a) => a.difficulty === level)
              const average = matching.length
                ? Math.round(
                    matching.reduce((sum, a) => sum + a.performance, 0) /
                      matching.length
                  )
                : 0
              return (
                <div className="skill-row" key={level}>
                  <div className="flex justify-between text-sm capitalize">
                    <span>{level}</span>
                    <span>
                      {matching.length
                        ? `${average}% · ${matching.length} attempts`
                        : "Not attempted"}
                    </span>
                  </div>
                  <Progress value={average} label={level} />
                </div>
              )
            })}
            <div className="subtle-banner mt-6">
              Next.js has the most room to grow at 35% mastery. Start with
              fundamentals.
            </div>
          </Panel>
        </div>
      )}
      {tab === "Activity" && (
        <Panel>
          <div className="panel-title">
            <div>
              <h3>Showing up adds up.</h3>
              <p className="muted mt-2 text-xs">
                Your saved assessments over the last 12 weeks
              </p>
            </div>
            <Badge>
              <Flame size={12} />
              {overview.activity.current}-day streak
            </Badge>
          </div>
          <div className="heatmap" aria-label="Assessment activity heatmap">
            {Array.from({ length: 84 }, (_, index) => {
              const date = new Date(Date.UTC(2026, 6, 2 + index))
                .toISOString()
                .slice(0, 10)
              const count = attempts.filter((a) =>
                a.date.startsWith(date)
              ).length
              return (
                <div
                  key={date}
                  className="heat-cell"
                  data-level={Math.min(4, count * 2)}
                  title={`${date}: ${count} assessments`}
                  role="img"
                  aria-label={`${date}: ${count} assessments`}
                />
              )
            })}
          </div>
          <div className="muted mt-4 flex justify-between text-xs">
            <span>July</span>
            <span>August</span>
            <span>September</span>
          </div>
          <div className="metric-grid mt-8">
            <Metric
              label="Active days"
              value={new Set(attempts.map((a) => a.date.slice(0, 10))).size}
            />
            <Metric
              label="Current streak"
              value={`${overview.activity.current} days`}
            />
            <Metric
              label="Longest streak"
              value={`${overview.activity.longest} days`}
            />
            <Metric label="Assessments saved" value={attempts.length} />
          </div>
        </Panel>
      )}
    </PageEntrance>
  )
}
