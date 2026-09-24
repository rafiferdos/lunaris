"use client"
import { statsService } from "@/features/stats/stats-service"
import { useState } from "react"
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  Trophy,
} from "lucide-react"
import {
  PageHeader,
  Panel,
  Avatar,
  Metric,
  Select,
  Badge,
} from "@/components/shared/ui"
import { PageEntrance } from "@/components/shared/motion"
import { Button } from "@/components/ui/button"
import { useUrlFilters } from "@/hooks/use-url-filters"
import { useProfile } from "@/features/profile/use-profile"
import { useAttempts } from "@/features/history/use-attempts"
import { leaderboardService, type RankedUser } from "./leaderboard-service"
export function LeaderboardPage() {
  const filters = useUrlFilters()
  const period = filters.get("period", "weekly"),
    category = filters.get("category", "Overall"),
    difficulty = filters.get("difficulty", "all"),
    topic = filters.get("topic", "all")
  const { users, current, total } = leaderboardService.getLeaderboard({
    period,
    category,
    difficulty,
    topic,
  })
  const profile = useProfile()
  const attempts = useAttempts()
  const overview = statsService.getOverview(attempts)
  const currentUser = {
    ...current,
    name: profile.name,
    username: profile.username,
    assessments: attempts.length,
    streak: overview.activity.current,
    accuracy: overview.accuracy,
    integrity: overview.integrity,
    rating: overview.rating,
    xp: overview.xp,
  }
  const [page, setPage] = useState(0)
  return (
    <PageEntrance>
      <PageHeader
        eyebrow="PROGRESS IN GOOD COMPANY"
        title="The leaderboard"
        description="Consistent effort adds up. See where you stand."
        action={
          <Badge>
            <Trophy size={12} />
            {total.toLocaleString()} ranked members
          </Badge>
        }
      />
      <div className="mb-6 flex flex-wrap justify-between gap-4">
        <div className="segmented">
          {["weekly", "monthly", "all-time"].map((value) => (
            <button
              key={value}
              className="capitalize"
              aria-pressed={value === period}
              onClick={() => {
                filters.set({ period: value })
                setPage(0)
              }}
            >
              {value.replace("-", " ")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            label="Ranking category"
            value={category}
            onChange={(value) => {
              filters.set({ category: value, topic: "all" })
              setPage(0)
            }}
            options={["Overall", "Technical", "Interpersonal"]}
          />
          <Select
            label="Ranking topic"
            value={topic}
            onChange={(value) => filters.set({ topic: value })}
            options={[
              { value: "all", label: "All topics" },
              ...(category === "Interpersonal"
                ? ["communication"]
                : category === "Technical"
                  ? ["javascript", "react", "typescript", "nextjs"]
                  : [
                      "javascript",
                      "react",
                      "typescript",
                      "nextjs",
                      "communication",
                    ]),
            ]}
          />
          <Select
            label="Ranking difficulty"
            value={difficulty}
            onChange={(value) => filters.set({ difficulty: value })}
            options={[
              { value: "all", label: "All levels" },
              "easy",
              "medium",
              "competitive",
            ]}
          />
        </div>
      </div>
      <div className="top-three">
        {users.slice(0, 3).map((user) => (
          <Panel key={user.id} className="top-person">
            <Avatar name={user.name} />
            <div>
              <p className="muted mb-1 text-xs">RANK {user.rank}</p>
              <h3>{user.name}</h3>
              <p className="muted mt-1 text-xs">
                {user.rating.toLocaleString()} rating
              </p>
            </div>
            <span className="rank-number">0{user.rank}</span>
          </Panel>
        ))}
      </div>
      <Panel className="section-space">
        <div className="metric-grid">
          <Metric
            label="Your position"
            value={`#${currentUser.rank}`}
            note="↑ 12 positions this week"
          />
          <Metric
            label="Your rating"
            value={currentUser.rating.toLocaleString()}
            note="Separate from assessment points"
          />
          <Metric
            label="Percentile"
            value={`Top ${Math.ceil((currentUser.rank / total) * 100)}%`}
            note={`Among ${total.toLocaleString()} members`}
          />
          <Metric
            label="Your momentum"
            value={`${overview.activity.current} days`}
            note="Keep your practice consistent"
          />
        </div>
      </Panel>
      <Panel className="section-space !p-0">
        <div className="table-scroll">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>MEMBER</th>
                <th>RATING</th>
                <th>XP</th>
                <th>ACCURACY</th>
                <th>ASSESSMENTS</th>
                <th>STREAK</th>
                <th>INTEGRITY</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(page * 10, page * 10 + 10).map((user) => (
                <RankingRow key={user.id} user={user} />
              ))}
              <RankingRow user={currentUser} current />
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="pagination">
        <span>
          Ranked by rating · {period.replace("-", " ")} · Mock rankings
        </span>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            aria-label="Previous ranking page"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ArrowLeft />
          </Button>
          <span>{page + 1} / 2</span>
          <Button
            variant="outline"
            aria-label="Next ranking page"
            disabled={page === 1}
            onClick={() => setPage(page + 1)}
          >
            <ArrowRight />
          </Button>
        </div>
      </div>
      <p className="muted text-xs">
        Filters select illustrative ranking snapshots. Easy assessments do not
        change rating; production eligibility and ranking will be API-owned.
      </p>
    </PageEntrance>
  )
}
function RankingRow({
  user,
  current = false,
}: {
  user: RankedUser
  current?: boolean
}) {
  return (
    <tr className={current ? "current-user" : ""}>
      <td>
        <span className="inline-flex items-center gap-3">
          <strong>{user.rank}</strong>
          <span className={user.movement > 0 ? "positive" : "muted"}>
            {user.movement > 0 ? (
              <ArrowUpRight size={13} />
            ) : (
              <ArrowDownRight size={13} />
            )}
          </span>
        </span>
      </td>
      <td>
        <div className="flex items-center gap-3">
          <Avatar name={user.name} small />
          <div>
            <strong>
              {user.name} {current && <Badge tone="mint">You</Badge>}
            </strong>
            <p className="muted text-xs">@{user.username}</p>
          </div>
        </div>
      </td>
      <td>
        <strong>{user.rating.toLocaleString()}</strong>
      </td>
      <td className="muted">{user.xp.toLocaleString()}</td>
      <td>{user.accuracy}%</td>
      <td>{user.assessments}</td>
      <td>{user.streak} days</td>
      <td>{user.integrity}%</td>
    </tr>
  )
}
