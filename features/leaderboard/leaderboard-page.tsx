"use client"
import { useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import {
  PageHeader,
  Panel,
  Avatar,
  Metric,
  Select,
  Badge,
  EmptyState,
} from "@/components/shared/ui"
import { QueryState } from "@/components/shared/query-state"
import { CursorPagination } from "@/components/shared/cursor-pagination"
import { useSession } from "@/features/auth/auth-boundary"
import { queries } from "@/lib/api/queries"
import type { RankingFilters, RankedUser } from "@/lib/api/types"
import { percent } from "@/lib/format"
import { useLiveLeaderboard } from "./use-live-leaderboard"
export function LeaderboardPage() {
  const { user } = useSession()
  const catalog = useQuery(queries.assessments(user.id)),
    assessments = catalog.data ?? []
  const [period, setPeriod] = useState<RankingFilters["period"]>("weekly"),
    [category, setCategory] = useState<RankingFilters["category"]>("overall"),
    [mode, setMode] = useState<RankingFilters["mode"]>("all"),
    [topic, setTopic] = useState("all")
  const filters: RankingFilters = {
    period,
    category,
    mode,
    limit: 15,
    ...(topic !== "all" ? { topic } : {}),
  }
  return (
    <>
      <PageHeader
        eyebrow="PROGRESS IN GOOD COMPANY"
        title="The leaderboard"
        description="Earn XP through eligible assessments. Rankings update as results arrive."
      />
      {catalog.error && (
        <QueryState error={catalog.error} retry={catalog.refetch} />
      )}
      <div className="mb-6 flex flex-wrap justify-between gap-4">
        <ToggleGroup
          aria-label="Ranking period"
          value={[period ?? "weekly"]}
          onValueChange={(v) => {
            if (v[0]) setPeriod(v[0] as RankingFilters["period"])
          }}
        >
          {["weekly", "monthly", "all_time"].map((p) => (
            <ToggleGroupItem key={p} value={p}>
              {p.replace("_", " ")}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex flex-wrap gap-2">
          <Select
            label="Ranking category"
            value={category ?? "overall"}
            onChange={(v) => {
              setCategory(v as RankingFilters["category"])
              setTopic("all")
            }}
            options={["overall", "technical", "interpersonal"]}
          />
          <Select
            label="Ranking topic"
            value={topic}
            onChange={setTopic}
            options={[
              { value: "all", label: "All topics" },
              ...assessments
                .filter(
                  (t) =>
                    category === "overall" ||
                    t.category.toLowerCase() === category
                )
                .map((t) => ({ value: t.slug, label: t.name })),
            ]}
          />
          <Select
            label="Ranking mode"
            value={mode ?? "all"}
            onChange={(v) => setMode(v as RankingFilters["mode"])}
            options={["all", "easy", "medium", "competitive"]}
          />
        </div>
      </div>
      <RankingTable key={JSON.stringify(filters)} filters={filters} />
    </>
  )
}
function RankingTable({ filters }: { filters: RankingFilters }) {
  const { user } = useSession(),
    [cursors, setCursors] = useState<(string | undefined)[]>([undefined])
  const page = cursors.length - 1
  const reset = useCallback(() => setCursors([undefined]), []),
    live = useLiveLeaderboard(reset)
  const query = useQuery(
    queries.rankings(user.id, { ...filters, cursor: cursors[page] })
  )
  if (!query.data)
    return <QueryState error={query.error} retry={query.refetch} />
  const { data: rows, meta } = query.data,
    current = meta.currentUser
  return (
    <>
      <div className="mb-5 flex justify-between">
        <Badge tone={live ? "mint" : "amber"}>
          {live ? "Live updates" : "Reconnecting live updates"}
        </Badge>
        <span className="muted text-xs">{meta.total} ranked members</span>
      </div>
      {query.error && <QueryState error={query.error} retry={query.refetch} />}
      <div className="top-three">
        {page === 0 &&
          rows.slice(0, 3).map((r) => (
            <Panel key={r.id} className="top-person">
              <Avatar name={r.name} />
              <div>
                <p className="muted text-xs">RANK {r.rank}</p>
                <h3>{r.name}</h3>
                <p>{(r.xp ?? 0).toLocaleString()} XP</p>
              </div>
            </Panel>
          ))}
      </div>
      <Panel className="section-space">
        <div className="metric-grid">
          <Metric
            label="Your position"
            value={current ? `#${current.rank}` : "Unranked"}
          />
          <Metric label="Your XP in this period" value={current?.xp ?? 0} />
          <Metric label="Your rating" value={current?.rating ?? "—"} />
          <Metric
            label="Percentile"
            value={
              meta.percentile == null
                ? "—"
                : `Top ${Math.ceil(meta.percentile)}%`
            }
          />
        </div>
      </Panel>
      <Panel className="section-space !p-0">
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "RANK",
                "MEMBER",
                "XP",
                "RATING",
                "ACCURACY",
                "ASSESSMENTS",
                "INTEGRITY",
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <RankingRow key={r.id} row={r} current={r.id === user.id} />
            ))}
            {current && !rows.some((r) => r.id === current.id) && (
              <RankingRow row={current} current />
            )}
          </TableBody>
        </Table>
      </Panel>
      {!rows.length && (
        <EmptyState
          title="No ranked results yet"
          description="Complete an eligible assessment, or choose another ranking period."
        />
      )}
      <CursorPagination
        page={page}
        pending={query.isFetching}
        hasNext={!!meta.nextCursor}
        previous={() => setCursors((c) => c.slice(0, -1))}
        next={() => setCursors((c) => [...c, meta.nextCursor ?? undefined])}
      />
      <p className="muted mt-5 text-xs">
        Ranked by XP, then rating, performance and assessment count. Live
        updates return to the first page.
      </p>
    </>
  )
}
function RankingRow({
  row: r,
  current = false,
}: {
  row: RankedUser
  current?: boolean
}) {
  return (
    <TableRow className={current ? "current-user" : ""}>
      <TableCell>{r.rank}</TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar name={r.name} small />
          <div>
            <strong>
              {r.name} {current && <Badge tone="mint">You</Badge>}
            </strong>
            {r.username && <p className="muted text-xs">@{r.username}</p>}
          </div>
        </div>
      </TableCell>
      <TableCell>{r.xp}</TableCell>
      <TableCell>{r.rating}</TableCell>
      <TableCell>{percent(r.accuracy)}</TableCell>
      <TableCell>{r.assessments}</TableCell>
      <TableCell>{percent(r.integrity)}</TableCell>
    </TableRow>
  )
}
