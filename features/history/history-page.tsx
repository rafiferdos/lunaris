"use client"
import { useState } from "react"
import Link from "next/link"
import { Search, ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react"
import {
  PageHeader,
  Panel,
  Select,
  Badge,
  EmptyState,
} from "@/components/shared/ui"
import { PageEntrance } from "@/components/shared/motion"
import { Button } from "@/components/ui/button"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { useAttempts } from "./use-attempts"
export function HistoryPage() {
  const attempts = useAttempts()
  const filters = useUrlFilters()
  const [page, setPage] = useState(0)
  const [referenceTime] = useState(() => Date.now())
  const query = filters.get("q")
  const category = filters.get("category", "all")
  const difficulty = filters.get("difficulty", "all")
  const period = filters.get("period", "all")
  const sort = filters.get("sort", "newest")
  const filtered = attempts
    .filter(
      (a) =>
        a.topicName.toLowerCase().includes(query.toLowerCase()) &&
        (category === "all" || a.category === category) &&
        (difficulty === "all" || a.difficulty === difficulty) &&
        (period === "all" ||
          Date.parse(a.date) >= referenceTime - Number(period) * 86400000)
    )
    .sort((a, b) =>
      sort === "score"
        ? b.performance - a.performance
        : sort === "oldest"
          ? Date.parse(a.date) - Date.parse(b.date)
          : Date.parse(b.date) - Date.parse(a.date)
    )
  const pages = Math.ceil(filtered.length / 8)
  const current = Math.min(page, Math.max(0, pages - 1))
  return (
    <PageEntrance>
      <PageHeader
        eyebrow="YOUR PRACTICE, RECORDED"
        title="Assessment history"
        description="Every attempt is a little more insight. See how far you’ve come."
      />
      <div className="filter-toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search history"
            value={query}
            onChange={(e) => filters.set({ q: e.target.value })}
            placeholder="Find an assessment…"
          />
        </label>
        <Select
          label="History category"
          value={category}
          onChange={(value) => filters.set({ category: value })}
          options={[
            { value: "all", label: "All categories" },
            "Technical",
            "Interpersonal",
          ]}
        />
        <Select
          label="History difficulty"
          value={difficulty}
          onChange={(value) => filters.set({ difficulty: value })}
          options={[
            { value: "all", label: "All levels" },
            "easy",
            "medium",
            "competitive",
          ]}
        />
        <Select
          label="History date range"
          value={period}
          onChange={(value) => filters.set({ period: value })}
          options={[
            { value: "all", label: "All dates" },
            { value: "7", label: "Last 7 days" },
            { value: "30", label: "Last 30 days" },
          ]}
        />
        <Select
          label="History sort"
          value={sort}
          onChange={(value) => filters.set({ sort: value })}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
            { value: "score", label: "Highest score" },
          ]}
        />
      </div>
      <Panel className="!p-0">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ASSESSMENT</th>
                <th>DATE</th>
                <th>PERFORMANCE</th>
                <th>RAW / NORMALIZED</th>
                <th>ACCURACY</th>
                <th>RATING / XP</th>
                <th>DURATION / INTEGRITY</th>
                <th>
                  <span className="sr-only">Open result</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(current * 8, current * 8 + 8).map((attempt) => (
                <tr key={attempt.id}>
                  <td>
                    <Link href={`/results/${attempt.id}`}>
                      <strong>{attempt.topicName}</strong>
                      <span className="muted mt-1 block text-xs capitalize">
                        {attempt.category} · {attempt.difficulty}
                      </span>
                    </Link>
                  </td>
                  <td className="muted">
                    {new Date(attempt.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </td>
                  <td>
                    <Badge tone="mint">{attempt.performance}%</Badge>
                  </td>
                  <td>
                    {attempt.raw}/{attempt.maximum}{" "}
                    <span className="muted">· {attempt.normalized}</span>
                  </td>
                  <td>{attempt.accuracy}%</td>
                  <td>
                    <span className="positive">
                      {attempt.ratingChange >= 0 ? "+" : ""}
                      {attempt.ratingChange}
                    </span>
                    <span className="muted"> · +{attempt.xp} XP</span>
                  </td>
                  <td>
                    {Math.floor(attempt.duration / 60)}m {attempt.duration % 60}
                    s <span className="muted">· {attempt.integrity}%</span>
                  </td>
                  <td>
                    <Link
                      href={`/results/${attempt.id}`}
                      aria-label={`Review ${attempt.topicName} result`}
                    >
                      <ArrowUpRight size={16} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <EmptyState description="Try another topic, date range, or difficulty." />
        )}
      </Panel>
      <div className="pagination">
        <span>
          {filtered.length} assessments · Dates relative to the September 23
          demo snapshot
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            aria-label="Previous history page"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <ArrowLeft />
          </Button>
          <span className="px-2 py-1">
            {current + 1} / {Math.max(1, pages)}
          </span>
          <Button
            variant="outline"
            aria-label="Next history page"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <ArrowRight />
          </Button>
        </div>
      </div>
    </PageEntrance>
  )
}
