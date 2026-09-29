"use client"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { PageHeader, Panel, Metric, Badge } from "@/components/shared/ui"
import { QueryState } from "@/components/shared/query-state"
import { CodeBlock } from "@/components/shared/code-block"
import { useSession } from "@/features/auth/auth-boundary"
import { queries } from "@/lib/api/queries"
import { percent, signed, dateTime } from "@/lib/format"
export function Results({ attemptId }: { attemptId: string }) {
  const { user } = useSession(),
    query = useQuery(queries.attempt(user.id, attemptId))
  if (!query.data)
    return <QueryState error={query.error} retry={query.refetch} />
  const attempt = query.data,
    r = attempt.result
  if (!r)
    return (
      <Panel>
        <h2>This assessment is still in progress</h2>
        <Button
          className="mt-5"
          nativeButton={false}
          render={
            <Link
              href={`/assessments/${attempt.topic.slug}/take?attempt=${attempt.id}`}
            />
          }
        >
          Resume assessment
        </Button>
      </Panel>
    )
  return (
    <>
      <Link className="text-link mb-7" href="/history">
        Back to history
      </Link>
      <PageHeader
        eyebrow={attempt.status.replaceAll("_", " ")}
        title={`${attempt.topic.name}, in perspective.`}
        description={`${attempt.mode} · ${dateTime(attempt.submittedAt ?? attempt.startedAt)} · ${Math.floor(r.durationSeconds / 60)}m ${r.durationSeconds % 60}s`}
      />
      {!r.rankEligible && (
        <Alert className="mb-6">
          <AlertDescription>
            This result is not eligible for ranked rewards. Your academic score
            and saved answers remain available.
            {attempt.reason
              ? ` Reason: ${attempt.reason.replaceAll("_", " ")}.`
              : ""}
          </AlertDescription>
        </Alert>
      )}
      <Panel className="result-hero">
        <div>
          <Badge tone="mint">Your results are ready</Badge>
          <p className="result-score mt-5">{percent(r.normalizedScore)}</p>
          <p className="muted mt-3">Normalized performance · 0–100</p>
        </div>
        <div className="metric-grid">
          <Metric
            label="Raw score"
            value={`${r.rawScore} / ${r.maximumPossibleScore}`}
            note={`Minimum possible: ${r.minimumPossibleScore}`}
          />
          <Metric label="XP earned" value={signed(r.xp)} />
          <Metric label="Rating change" value={signed(r.ratingChange)} />
          <Metric
            label="Topic rating change"
            value={signed(r.topicRatingChange)}
          />
        </div>
      </Panel>
      <div className="metric-grid section-space">
        <Panel>
          <Metric
            label="Objective accuracy"
            value={percent(r.accuracyPercent)}
          />
        </Panel>
        <Panel>
          <Metric
            label="Weighted answer quality"
            value={percent(r.answerQualityPercent)}
          />
        </Panel>
        <Panel>
          <Metric label="Integrity" value={percent(r.integrity)} />
        </Panel>
        <Panel>
          <Metric
            label="Answer summary"
            value={`${r.correct} correct`}
            note={`${r.partial} partial · ${r.skipped} skipped`}
          />
        </Panel>
      </div>
      <Panel className="section-space">
        <h2>Answer review</h2>
        <Accordion className="mt-5">
          {r.reviews.map((review, i) => {
            const q = review.question
            return (
              <AccordionItem key={review.questionId} value={review.questionId}>
                <AccordionTrigger>
                  <span className="text-left">
                    {i + 1}. {q.prompt}
                  </span>
                  <Badge>
                    {review.outcome} · {review.points} points
                  </Badge>
                </AccordionTrigger>
                <AccordionContent>
                  {q.context && <p className="mb-4">{q.context}</p>}
                  {q.code && <CodeBlock code={q.code} language={q.language} />}
                  <ul className="my-5 space-y-3">
                    {q.options.map((o) => (
                      <li key={o.id} className="rounded-md border p-3">
                        <span>{o.text}</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {review.selected.includes(o.id) && (
                            <Badge>Your answer</Badge>
                          )}
                          {"isCorrect" in o && o.isCorrect && (
                            <Badge tone="mint">Correct answer</Badge>
                          )}
                          {"quality" in o && (
                            <Badge
                              tone={o.quality === "BEST" ? "mint" : "neutral"}
                            >
                              {o.quality}
                            </Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {!review.selected.length && <p className="muted">Skipped</p>}
                  <p className="text-sm leading-7">{q.explanation}</p>
                  <p className="muted mt-3 text-xs">
                    {q.tags.join(" · ")}
                    {review.responseTimeMs != null
                      ? ` · ${Math.round(review.responseTimeMs / 1000)}s response time`
                      : ""}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </Panel>
    </>
  )
}
