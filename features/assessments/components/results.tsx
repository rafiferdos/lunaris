"use client"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import Link from "next/link"
import { resultInsights } from "../utils/result-insights"
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react"
import {
  Badge,
  PageHeader,
  Panel,
  Metric,
  Progress,
  EmptyState,
} from "@/components/shared/ui"
import { PageEntrance } from "@/components/shared/motion"
import { CodeBlock } from "@/components/shared/code-block"
import { useAttempts } from "@/features/history/use-attempts"
import { useHydrated } from "@/lib/local-store"
import { levels } from "../data/levels"
export function Results({ attemptId }: { attemptId: string }) {
  const attempts = useAttempts()
  const hydrated = useHydrated()
  const attempt = attempts.find((a) => a.id === attemptId)
  if (!attempt) {
    return !hydrated ? (
      <Skeleton className="skeleton" />
    ) : (
      <EmptyState
        title="Result not found"
        description="This demo result may belong to another browser, or local data was cleared."
      >
        <Button
          variant="default"
          nativeButton={false}
          render={<Link href="/history" />}
        >
          View history
        </Button>
      </EmptyState>
    )
  }
  const insights = resultInsights(attempt)
  const { correct, skipped, best, average } = insights
  return (
    <PageEntrance>
      <Link href="/history" className="text-link mb-7">
        <ArrowLeft size={15} />
        Assessment history
      </Link>
      <PageHeader
        eyebrow="ASSESSMENT COMPLETE"
        title={`${attempt.topicName}, in perspective.`}
        description={`${levels[attempt.difficulty].name} · ${new Date(attempt.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })} · ${Math.floor(attempt.duration / 60)}m ${attempt.duration % 60}s`}
      />
      <Panel className="result-hero">
        <div>
          <Badge tone="mint">
            <CheckCircle2 size={12} />
            Your results are ready
          </Badge>
          <p className="result-score mt-5">
            {attempt.performance}
            <span className="text-3xl tracking-normal">%</span>
          </p>
          <p className="muted mt-3 text-sm">Overall performance</p>
        </div>
        <div className="metric-grid gap-8">
          <Metric
            label="Raw score"
            value={`${attempt.raw} / ${attempt.maximum}`}
          />
          <Metric
            label="Normalized score"
            value={`${attempt.normalized}`}
            note="Demo scale: 0–1,000"
          />
          <Metric
            label="Rating change"
            value={`${attempt.ratingChange >= 0 ? "+" : ""}${attempt.ratingChange}`}
            note={
              attempt.difficulty === "easy"
                ? "Practice · Unranked"
                : "Demo estimate"
            }
          />
          <Metric label="XP earned" value={`+${attempt.xp}`} />
        </div>
      </Panel>
      <div className="metric-grid section-space">
        <Panel>
          <Metric
            label="Accuracy / best answers"
            value={`${attempt.accuracy}%`}
            note={`${correct} out of ${attempt.reviews.length} questions`}
          />
        </Panel>
        <Panel>
          <Metric
            label="Integrity"
            value={`${attempt.integrity}%`}
            note="Browser focus signals only"
          />
        </Panel>
        <Panel>
          <Metric
            label="Average response"
            value={`${average}s`}
            note={`Fastest: ${insights.fastest}s`}
          />
        </Panel>
        <Panel>
          <Metric
            label="Answer summary"
            value={`${correct} / ${attempt.reviews.length}`}
            note={`${insights.incorrect} incorrect · ${skipped} skipped · ${best} best`}
          />
        </Panel>
      </div>
      <div className="two-column section-space">
        <Panel>
          <h3>Performance by subtopic</h3>
          {attempt.reviews.map((review) => (
            <div className="skill-row" key={review.question.id}>
              <div className="flex justify-between text-xs">
                <span>{review.question.tags.join(", ")}</span>
                <span>
                  {Math.max(
                    0,
                    Math.round((review.points / review.maximum) * 100)
                  )}
                  %
                </span>
              </div>
              <Progress
                value={Math.max(0, (review.points / review.maximum) * 100)}
                label={review.question.tags[0]}
              />
            </div>
          ))}
        </Panel>
        <Panel>
          <h3>What to focus on next</h3>
          <div className="mt-5">
            <p className="eyebrow">STRONGEST AREA</p>
            <h2>{insights.strongest?.question.tags[0]}</h2>
            <p className="muted mt-3 text-sm">
              You showed a clear understanding here. Keep applying it in real
              work.
            </p>
          </div>
          <div className="mt-7">
            <p className="eyebrow">WORTH REVISITING</p>
            <h2>
              {insights.perfect
                ? "Ready for a deeper challenge"
                : insights.weakest?.question.tags[0]}
            </h2>
            <p className="muted mt-3 text-sm">
              Review the explanation below before your next attempt.
            </p>
          </div>
          <Separator className="my-6" />
          <p className="muted text-xs">
            Percentiles and mastery changes will come from the scoring API. This
            demo does not infer population rankings from five questions.
          </p>
        </Panel>
      </div>
      <div className="two-column section-space">
        <Panel>
          <h3>Answer quality</h3>
          <p className="muted mt-2 text-xs">
            Weighted responses preserve their quality labels.
          </p>
          {Object.entries(insights.qualities).map(([quality, count]) => (
            <div className="skill-row" key={quality}>
              <div className="flex justify-between text-xs">
                <span>{quality}</span>
                <span>
                  {count} of {attempt.reviews.length}
                </span>
              </div>
              <Progress
                value={(count / attempt.reviews.length) * 100}
                label={quality}
              />
            </div>
          ))}
        </Panel>
        <Panel>
          <h3>Time per question</h3>
          <p className="muted mt-2 text-xs">
            Spot questions that needed more thought.
          </p>
          {attempt.reviews.map((review, index) => (
            <div className="skill-row" key={review.question.id}>
              <div className="flex justify-between text-xs">
                <span>
                  Question {index + 1} · {review.question.tags[0]}
                </span>
                <span>{review.answer.seconds}s</span>
              </div>
              <Progress
                value={
                  (review.answer.seconds /
                    Math.max(1, ...insights.responseTimes)) *
                  100
                }
                label={`Question ${index + 1} response time`}
              />
            </div>
          ))}
        </Panel>
      </div>
      <div className="section-heading section-space">
        <div>
          <h2>Every answer, explained.</h2>
          <p className="muted mt-1 text-sm">
            Review the reasoning, not just the score.
          </p>
        </div>
        <Badge>{attempt.reviews.length} questions</Badge>
      </div>
      {attempt.reviews.map((review, index) => {
        const selected = review.question.options.filter((o) =>
          review.answer.selected.includes(o.id)
        )
        const correctOptions = review.question.options.filter((o) =>
          "correct" in o ? o.correct : o.quality === "Best"
        )
        return (
          <Accordion key={review.question.id} className="review-row">
            <AccordionItem value="details" className="border-0">
              <AccordionTrigger>
                <span className="muted font-mono text-xs">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">{review.question.prompt}</span>
                <Badge
                  tone={
                    ["Correct", "Best", "Strong"].includes(review.quality)
                      ? "mint"
                      : review.quality === "Skipped"
                        ? "neutral"
                        : "amber"
                  }
                >
                  {review.quality}
                </Badge>
              </AccordionTrigger>
              <AccordionContent>
                <div className="review-body">
                  {review.question.code && (
                    <CodeBlock
                      code={review.question.code}
                      language={review.question.language}
                    />
                  )}
                  <p>
                    <strong>Your answer:</strong>{" "}
                    {selected.map((o) => o.text).join(" · ") || "Not answered"}
                  </p>
                  <p>
                    <strong>
                      {review.question.type === "weighted"
                        ? "Best response"
                        : "Correct answer"}
                      :
                    </strong>{" "}
                    {correctOptions.map((o) => o.text).join(" · ")}
                  </p>
                  <p className="review-explanation">
                    {review.question.explanation}
                  </p>
                  <p className="muted text-xs">
                    {review.points} / {review.maximum} points ·{" "}
                    {review.answer.seconds}s · {review.question.tags.join(", ")}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )
      })}
      <div className="subtle-banner section-space">
        <ShieldCheck size={18} />
        Demo scoring is illustrative. A future backend will calculate
        authoritative rating, XP, normalization, and integrity.
      </div>
      <div className="mt-6 flex justify-end">
        <Button
          variant="default"
          nativeButton={false}
          render={<Link href="/assessments" />}
        >
          Explore assessments
          <ArrowRight size={15} />
        </Button>
      </div>
    </PageEntrance>
  )
}
