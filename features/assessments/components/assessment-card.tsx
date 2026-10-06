import Link from "@/components/shared/app-link"
import { ArrowUpRight, Clock3, Check, LockKeyhole } from "lucide-react"
import type { Topic } from "../types/assessment"
import { Badge, Progress } from "@/components/shared/ui"
export function AssessmentCard({
  topic,
  attempts,
}: {
  topic: Topic
  attempts: number
}) {
  return (
    <Link href={`/assessments/${topic.slug}`} className="assessment-card group">
      <div className="flex items-start justify-between">
        <span className={`topic-icon tone-${topic.accent}`}>
          {topic.monogram}
        </span>
        {topic.mastery >= 80 ? (
          <Badge tone="mint">
            <Check size={11} />
            Strong skill
          </Badge>
        ) : !topic.available ? (
          <Badge>Coming soon</Badge>
        ) : (
          <ArrowUpRight className="card-arrow" size={19} />
        )}
      </div>
      <div>
        <p className="card-category">{topic.category}</p>
        <h3>{topic.name}</h3>
        <p className="card-description">{topic.description}</p>
      </div>
      <div className="card-meta">
        <span>
          <Clock3 size={13} />
          {topic.available ? "6–10 min" : "In development"}
        </span>
        <span>{topic.available ? "3 levels" : "New topic"}</span>
      </div>
      <div className="card-progress">
        <div className="flex justify-between text-xs">
          <span className="muted">
            {attempts
              ? "Your mastery"
              : topic.available
                ? "Ready for your first attempt"
                : "Question set in preparation"}
          </span>
          <strong>
            {attempts ? (
              `${topic.mastery}%`
            ) : !topic.available ? (
              <LockKeyhole size={12} />
            ) : (
              "—"
            )}
          </strong>
        </div>
        <Progress
          value={attempts ? topic.mastery : 0}
          label={`${topic.name} mastery`}
        />
      </div>
    </Link>
  )
}
