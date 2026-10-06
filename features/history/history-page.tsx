"use client"
import { DatePicker } from "@/components/shared/date-picker"
import { useState } from "react"
import Link from "@/components/shared/app-link"
import { useQuery } from "@tanstack/react-query"
import {
  PageHeader,
  Panel,
  Metric,
  Select,
  EmptyState,
  Badge,
} from "@/components/shared/ui"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { QueryState } from "@/components/shared/query-state"
import { useSession } from "@/features/auth/auth-boundary"
import { queries } from "@/lib/api/queries"
import type { HistoryFilters } from "@/lib/api/types"
import { percent, dateTime, signed } from "@/lib/format"
import { CursorPagination } from "@/components/shared/cursor-pagination"
export function HistoryPage() {
  const { user } = useSession()
  const catalog = useQuery(queries.assessments(user.id)),
    overviewQuery = useQuery(queries.overview(user.id))
  const overview = overviewQuery.data,
    assessments = catalog.data ?? []
  const [topic, setTopic] = useState("all"),
    [mode, setMode] = useState("all"),
    [status, setStatus] = useState("all")
  const [category, setCategory] = useState("all"),
    [from, setFrom] = useState(""),
    [to, setTo] = useState("")
  const filters: HistoryFilters = {
    limit: 15,
    ...(category !== "all"
      ? { category: category as HistoryFilters["category"] }
      : {}),
    ...(from ? { from: `${from}T00:00:00.000Z` } : {}),
    ...(to ? { to: `${to}T23:59:59.999Z` } : {}),
    ...(topic !== "all" ? { topic } : {}),
    ...(mode !== "all" ? { mode: mode as HistoryFilters["mode"] } : {}),
    ...(status !== "all" ? { status: status as HistoryFilters["status"] } : {}),
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR LEARNING TRAIL"
        title="Assessment history"
        description="Every attempt, saved to your account."
      />
      <Panel>
        {overview ? (
          <div className="metric-grid">
            <Metric label="Completed" value={overview.assessmentCount} />
            <Metric
              label="Average performance"
              value={percent(overview.averageNormalizedScore)}
            />
            <Metric label="Total XP" value={overview.totalXp} />
            <Metric label="Rating" value={overview.rating} />
          </div>
        ) : (
          <QueryState
            error={overviewQuery.error}
            retry={overviewQuery.refetch}
          />
        )}
      </Panel>
      {catalog.error && (
        <QueryState error={catalog.error} retry={catalog.refetch} />
      )}
      <div className="section-space mb-5 flex flex-wrap gap-3">
        <Select
          label="History topic"
          value={topic}
          onChange={setTopic}
          options={[
            { value: "all", label: "All topics" },
            ...assessments.map((t) => ({ value: t.slug, label: t.name })),
          ]}
        />
        <Select
          label="History mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: "all", label: "All modes" },
            "EASY",
            "MEDIUM",
            "COMPETITIVE",
          ]}
        />
        <Select
          label="Attempt status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All statuses" },
            "IN_PROGRESS",
            "SUBMITTED",
            "AUTO_SUBMITTED",
            "EXPIRED",
          ]}
        />
      </div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Select
          label="History category"
          value={category}
          onChange={setCategory}
          options={[
            { value: "all", label: "All categories" },
            "TECHNICAL",
            "INTERPERSONAL",
          ]}
        />
        <DatePicker
          label="From (UTC)"
          value={from}
          max={to || undefined}
          onChange={setFrom}
        />
        <DatePicker
          label="To (UTC)"
          value={to}
          min={from || undefined}
          onChange={setTo}
        />
      </div>
      <HistoryTable key={JSON.stringify(filters)} filters={filters} />
    </>
  )
}
function HistoryTable({ filters }: { filters: HistoryFilters }) {
  const { user } = useSession(),
    [cursors, setCursors] = useState<(string | undefined)[]>([undefined])
  const page = cursors.length - 1
  const query = useQuery(
    queries.history(user.id, { ...filters, cursor: cursors[page] })
  )
  if (!query.data)
    return <QueryState error={query.error} retry={query.refetch} />
  return (
    <>
      {query.error && <QueryState error={query.error} retry={query.refetch} />}
      <Panel className="!p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "TOPIC",
                "DATE",
                "MODE",
                "STATUS",
                "PERFORMANCE",
                "XP",
                "RATING",
                "",
              ].map((t) => (
                <TableHead key={t}>{t}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.data.map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.topicName}</TableCell>
                <TableCell>{dateTime(a.date)}</TableCell>
                <TableCell>{a.mode}</TableCell>
                <TableCell>
                  <Badge>{a.status.replaceAll("_", " ")}</Badge>
                </TableCell>
                <TableCell>{percent(a.normalizedScore)}</TableCell>
                <TableCell>{a.xp ?? "—"}</TableCell>
                <TableCell>
                  {a.ratingChange == null ? "—" : signed(a.ratingChange)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    nativeButton={false}
                    render={
                      <Link
                        href={
                          a.status === "IN_PROGRESS"
                            ? `/assessments/${a.topic}/take?attempt=${a.id}`
                            : `/results/${a.id}`
                        }
                      />
                    }
                  >
                    {a.status === "IN_PROGRESS" ? "Resume" : "View result"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      {!query.data.data.length && (
        <EmptyState
          title="No attempts yet"
          description="Your assessments will appear here. Try clearing the filters."
        />
      )}
      <CursorPagination
        page={page}
        pending={query.isFetching}
        hasNext={!!query.data.meta.nextCursor}
        previous={() => setCursors((c) => c.slice(0, -1))}
        next={() =>
          setCursors((c) => [...c, query.data.meta.nextCursor ?? undefined])
        }
      />
    </>
  )
}
