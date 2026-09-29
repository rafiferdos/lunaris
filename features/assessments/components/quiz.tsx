"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  PageHeader,
  Panel,
  Badge,
  Progress,
  EmptyState,
} from "@/components/shared/ui"
import { QueryState, MutationError } from "@/components/shared/query-state"
import { useWorkspace } from "@/features/workspace/workspace-provider"
import { useSession } from "@/features/auth/auth-boundary"
import { queries, invalidateProgress } from "@/lib/api/queries"
import { api, unwrap, errorMessage } from "@/lib/api/client"
import type { ServerAttempt, Mode, IntegrityEvent } from "@/lib/api/types"
import { useAttemptLease } from "../hooks/use-attempt-lease"
import { useAttemptActions } from "../hooks/use-attempt-actions"
import { useCountdown } from "../hooks/use-countdown"
import { startKey, getStartRequestKey } from "../hooks/start-request"
import { useIntegrity } from "@/features/integrity/use-integrity"
import { useSpeechMonitor } from "@/features/integrity/use-speech-monitor"
import { QuestionStep } from "./question-step"
import { modeLabels } from "../services/assessment-service"
export function Quiz({ slug }: { slug: string }) {
  const search = useSearchParams(),
    id = search.get("attempt"),
    level = search.get("level") ?? "easy"
  if (id && !z.uuid().safeParse(id).success)
    return (
      <EmptyState
        title="Invalid attempt"
        description="Open your saved assessment from history."
      />
    )
  if (id) return <AttemptSession key={id} id={id} slug={slug} />
  const mode = (
    { easy: "EASY", medium: "MEDIUM", competitive: "COMPETITIVE" } as const
  )[level as "easy" | "medium" | "competitive"]
  if (!mode)
    return (
      <EmptyState
        title="Unknown assessment mode"
        description="Choose a level from the assessment details."
      />
    )
  return <StartAssessment slug={slug} mode={mode} />
}
function StartAssessment({ slug, mode }: { slug: string; mode: Mode }) {
  const { assessments } = useWorkspace(),
    { user } = useSession(),
    router = useRouter(),
    client = useQueryClient()
  const [consent, setConsent] = useState(false),
    [error, setError] = useState("")
  const topic = assessments.find((t) => t.slug === slug),
    policy = topic?.modes.find((m) => m.mode === mode)
  const active = useQuery(
    queries.history(user.id, { status: "IN_PROGRESS", limit: 1 })
  )
  const start = useMutation({
    mutationFn: async () => {
      const key = startKey(user.id, slug, mode),
        requestKey = getStartRequestKey(key, sessionStorage)
      return (
        await unwrap(
          api.POST("/api/v1/attempts", {
            body: { topicSlug: slug, mode, requestKey },
          })
        )
      ).data
    },
    onSuccess: async (attempt) => {
      client.setQueryData(
        queries.attempt(user.id, attempt.id).queryKey,
        attempt
      )
      sessionStorage.removeItem(startKey(user.id, slug, mode))
      router.replace(`/assessments/${slug}/take?attempt=${attempt.id}`)
      await invalidateProgress(client, user.id)
    },
  })
  async function begin() {
    setError("")
    if (mode === "COMPETITIVE" && !document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        setError(
          "Fullscreen is unavailable. Use a supported browser or choose another mode."
        )
        return
      }
    }
    start.mutate()
  }
  if (!topic || !policy)
    return (
      <EmptyState
        title="Assessment unavailable"
        description="Choose an available topic from the catalog."
      />
    )
  const existing = active.data?.data[0]
  return (
    <div className="quiz-layout">
      <Link href={`/assessments/${slug}`} className="text-link mb-7">
        Back to {topic.name}
      </Link>
      <PageHeader
        eyebrow="BEFORE YOU BEGIN"
        title={`${topic.name} · ${modeLabels[mode]}`}
        description="A few minutes of focus. A clearer picture of your skills."
      />
      <Panel>
        <div className="metric-grid">
          <div>
            <h3>{policy.questionCount} questions</h3>
            <p className="muted mt-1">Selected for this mode</p>
          </div>
          <div>
            <h3>{Math.round(policy.durationSeconds / 60)} minutes</h3>
            <p className="muted mt-1">Server-enforced timer</p>
          </div>
        </div>
        <h3 className="mt-7">A fair assessment for everyone</h3>
        <ul className="muted my-5 space-y-3 text-sm">
          <li>
            Starting consumes one attempt. Closing the page does not refund it.
          </li>
          <li>
            {policy.editable
              ? "Answers autosave and can be edited before submission."
              : "Answers are committed when you continue and cannot be changed."}
          </li>
          <li>
            Skipped questions receive the lowest score, including negative marks
            where configured.
          </li>
          <li>
            {mode === "COMPETITIVE"
              ? "Leaving this tab immediately submits your saved answers and removes ranked rewards."
              : "Focus changes are sent as integrity signals."}
          </li>
          <li>
            You may enable local speech monitoring during the assessment. Only
            activity summaries are sent; audio is never uploaded or stored.
          </li>
        </ul>
        <Label className="flex gap-3">
          <Checkbox
            checked={consent}
            onCheckedChange={(v) => setConsent(v === true)}
          />
          I understand the assessment rules and focus monitoring.
        </Label>
        {existing ? (
          <Alert className="mt-5">
            <AlertDescription>
              You have an active assessment.{" "}
              <Link
                className="underline"
                href={`/assessments/${existing.topic}/take?attempt=${existing.id}`}
              >
                Resume {existing.topicName}
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}
        {error && (
          <Alert className="mt-5" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <MutationError error={start.error} />
        <Button
          className="mt-6"
          onClick={() => void begin()}
          disabled={
            !consent ||
            start.isPending ||
            !policy.available ||
            (!topic.availability.canStart && !start.isError) ||
            !!existing
          }
        >
          {start.isPending
            ? "Starting…"
            : start.isError
              ? "Retry start"
              : "Start assessment"}
        </Button>
        {!topic.availability.canStart && (
          <p className="muted mt-4">
            Your attempt quota is used. Resume an active attempt or wait for the
            next UTC reset.
          </p>
        )}
      </Panel>
    </div>
  )
}
function AttemptSession({ id, slug }: { id: string; slug: string }) {
  const { user } = useSession(),
    router = useRouter(),
    client = useQueryClient()
  const query = useQuery({
    ...queries.attempt(user.id, id),
    refetchInterval: (q) =>
      q.state.data?.status === "IN_PROGRESS" ? 15_000 : false,
  })
  useEffect(() => {
    if (query.data && query.data.status !== "IN_PROGRESS") {
      void invalidateProgress(client, user.id)
      if (document.fullscreenElement)
        void document.exitFullscreen().catch(() => {})
      router.replace(`/results/${id}`)
    }
  }, [query.data, router, id, client, user.id])
  if (!query.data)
    return <QueryState error={query.error} retry={query.refetch} />
  if (query.data.topic.slug !== slug)
    return (
      <EmptyState
        title="Attempt does not match this topic"
        description="Open this assessment from your history."
      />
    )
  if (query.data.status !== "IN_PROGRESS")
    return <QueryState label="Opening your result" />
  return <LeasedAttempt attempt={query.data} receivedAt={query.dataUpdatedAt} />
}
function LeasedAttempt({
  attempt,
  receivedAt,
}: {
  attempt: ServerAttempt
  receivedAt: number
}) {
  const lease = useAttemptLease(attempt.id)
  if (lease.state === "checking")
    return <QueryState label="Opening this assessment" />
  if (lease.state === "blocked")
    return (
      <Panel>
        <h2>This attempt is open in another tab</h2>
        <p className="muted mt-3">
          Use that tab, or close it before resuming here.
        </p>
        <Button className="mt-5" onClick={lease.retry}>
          Resume here
        </Button>
      </Panel>
    )
  return <ActiveAttempt attempt={attempt} receivedAt={receivedAt} />
}
function ActiveAttempt({
  attempt,
  receivedAt,
}: {
  attempt: ServerAttempt
  receivedAt: number
}) {
  const [index, setIndex] = useState(() =>
    Math.min(
      attempt.currentPosition +
        (attempt.questions[attempt.currentPosition]?.answered &&
        !attempt.policy.backNavigation
          ? 1
          : 0),
      attempt.questions.length - 1
    )
  )
  const [initialSequence] = useState(attempt.nextIntegritySequence)
  const actions = useAttemptActions(attempt.id)
  const { send } = actions
  const sendEvent = useCallback(
    (event: IntegrityEvent) => send({ type: "event", event }),
    [send]
  )
  const integrity = useIntegrity(true, attempt.id, initialSequence, sendEvent),
    mic = useSpeechMonitor(true)
  const remaining = useCountdown(
    attempt.expiresAt,
    attempt.serverTime,
    receivedAt
  )
  const { user } = useSession(),
    client = useQueryClient()
  useEffect(() => {
    if (remaining === 0)
      void client.invalidateQueries({
        queryKey: queries.attempt(user.id, attempt.id).queryKey,
      })
  }, [remaining, client, user.id, attempt.id])
  const question = attempt.questions[index]
  const save = useCallback(
    (selected: string[], responseTimeMs: number) =>
      send({
        type: "answer",
        questionId: question.id,
        selected,
        responseTimeMs,
      }),
    [send, question.id]
  )
  const [fullscreenError, setFullscreenError] = useState("")
  async function fullscreen() {
    try {
      await document.documentElement.requestFullscreen()
      setFullscreenError("")
    } catch (e) {
      setFullscreenError(errorMessage(e))
    }
  }
  return (
    <div className="quiz-layout">
      <div className="quiz-topline">
        <div>
          <p className="eyebrow">{modeLabels[attempt.mode]}</p>
          <h1>{attempt.topic.name}</h1>
        </div>
        <Badge>
          {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}{" "}
          remaining
        </Badge>
      </div>
      <Progress
        value={((index + 1) / attempt.questionCount) * 100}
        label="Question progress"
      />
      <div className="my-5 flex flex-wrap items-center gap-3">
        <Badge>Integrity {attempt.integrity.score}%</Badge>
        <Button variant="outline" size="sm" onClick={() => void fullscreen()}>
          Restore fullscreen
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={mic.status === "ready" || mic.status === "loading"}
          onClick={() => void mic.enable()}
        >
          {mic.status === "ready"
            ? "Microphone monitoring active"
            : mic.status === "loading"
              ? "Starting microphone…"
              : "Enable local speech monitoring"}
        </Button>
        <span className="muted text-xs">
          {mic.status === "unavailable"
            ? "Microphone unavailable. No automatic misconduct penalty."
            : "No audio is uploaded."}
        </span>
      </div>
      {fullscreenError && <p role="alert">{fullscreenError}</p>}
      {(integrity.warning || integrity.error) && (
        <Alert className="mb-5">
          <AlertDescription>
            {integrity.error || integrity.warning}
          </AlertDescription>
        </Alert>
      )}
      <QuestionStep
        key={question.id}
        question={question}
        index={index}
        total={attempt.questionCount}
        editable={attempt.policy.editable}
        backNavigation={attempt.policy.backNavigation}
        disabled={remaining === 0}
        save={save}
        navigate={setIndex}
        submit={() => send({ type: "submit" })}
      />
      <MutationError error={actions.error} />
      <p className="muted mt-5 text-xs">
        Question and option order are saved. You can resume this attempt from
        history before its deadline.
      </p>
    </div>
  )
}
