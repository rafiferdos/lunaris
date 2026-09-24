"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge, Panel, PageHeader, Progress } from "@/components/shared/ui"
import { CodeBlock } from "@/components/shared/code-block"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { useIntegrity } from "@/features/integrity/use-integrity"
import {
  saveAttempt,
  useAttempts,
  attemptAvailability,
} from "@/features/history/use-attempts"
import { usePreferences } from "@/features/settings/preferences"
import { levels, attemptLimits } from "../data/levels"
import type { Question, Difficulty } from "../schemas/question"
import type { Topic, Answer } from "../types/assessment"
import { scoreAttempt } from "../utils/scoring"
export function Quiz({
  topic,
  questions,
  difficulty,
}: {
  topic: Topic
  questions: Question[]
  difficulty: Difficulty
}) {
  const router = useRouter()
  const level = levels[difficulty]
  const preferences = usePreferences()
  const attempts = useAttempts()
  const availability = attemptAvailability(attempts)
  const [started, setStarted] = useState(false)
  const [consent, setConsent] = useState(false)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [remaining, setRemaining] = useState(level.seconds)
  const [confirm, setConfirm] = useState(false)
  const [error, setError] = useState("")
  const [finished, setFinished] = useState(false)
  const clock = useRef(0)
  const deadline = useRef(0)
  const submitting = useRef(false)
  const integrity = useIntegrity(
    started && !finished && consent,
    difficulty === "competitive"
  )
  const question = questions[index]
  const selected =
    answers.find((a) => a.questionId === question.id)?.selected ?? []
  const capture = useCallback(() => {
    const seconds = Math.max(0, Math.round((Date.now() - clock.current) / 1000))
    clock.current = Date.now()
    return answers.some((a) => a.questionId === question.id)
      ? answers.map((a) =>
          a.questionId === question.id
            ? { ...a, seconds: a.seconds + seconds }
            : a
        )
      : [...answers, { questionId: question.id, selected: [], seconds }]
  }, [answers, question.id])
  const submit = useCallback(() => {
    if (submitting.current) return
    submitting.current = true
    try {
      const finalAnswers = capture()
      const attempt = scoreAttempt(
        topic,
        difficulty,
        questions,
        finalAnswers,
        integrity.score
      )
      saveAttempt(attempt)
      setFinished(true)
      setStarted(false)
      if (document.fullscreenElement)
        void document.exitFullscreen().catch(() => {})
      router.push(`/results/${attempt.id}`)
    } catch {
      setError(
        "Your result could not be saved. Allow browser storage, then try submitting again."
      )
      submitting.current = false
      setConfirm(false)
    }
  }, [capture, difficulty, integrity.score, questions, router, topic])
  useEffect(() => {
    if (!started || finished) return
    const timer = window.setInterval(() => {
      const seconds = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000)
      )
      setRemaining(seconds)
      if (
        seconds === 0 ||
        integrity.events.warnings >= attemptLimits.violationThreshold
      )
        submit()
    }, 1000)
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", unload)
    return () => {
      clearInterval(timer)
      window.removeEventListener("beforeunload", unload)
    }
  }, [started, finished, integrity.events.warnings, submit])
  async function start() {
    setError("")
    if (difficulty === "competitive") {
      try {
        await document.documentElement.requestFullscreen()
      } catch {
        setError(
          "Fullscreen is unavailable in this browser. Use a supported browser or choose Easy or Medium."
        )
        return
      }
    }
    clock.current = Date.now()
    deadline.current = Date.now() + level.seconds * 1000
    setStarted(true)
  }
  function choose(id: string) {
    const next =
      question.type === "multiple"
        ? selected.includes(id)
          ? selected.filter((value) => value !== id)
          : [...selected, id]
        : [id]
    setAnswers((previous) => [
      ...previous.filter((a) => a.questionId !== question.id),
      {
        questionId: question.id,
        selected: next,
        seconds:
          previous.find((a) => a.questionId === question.id)?.seconds ?? 0,
      },
    ])
  }
  function navigate(next: number) {
    setAnswers(capture())
    setIndex(next)
  }
  if (!started)
    return (
      <div className="quiz-layout">
        <Link href={`/assessments/${topic.slug}`} className="text-link mb-7">
          <ArrowLeft size={14} />
          Back to {topic.name}
        </Link>
        <PageHeader
          eyebrow="BEFORE YOU BEGIN"
          title={`${topic.name} · ${level.name}`}
          description="A few minutes of focus. A clearer picture of your skills."
        />
        <Panel>
          <div className="metric-grid">
            <div>
              <h3>{questions.length} questions</h3>
              <p className="muted mt-1 text-xs">A curated demo set</p>
            </div>
            <div>
              <h3>{level.seconds / 60} minutes</h3>
              <p className="muted mt-1 text-xs">Submits when time ends</p>
            </div>
          </div>
          <hr className="my-6" />
          <h3 className="flex items-center gap-2">
            <ShieldCheck size={18} />A fair assessment for everyone
          </h3>
          <ul className="muted mt-5 mb-6 space-y-3 text-sm">
            <li>
              •{" "}
              {level.previous
                ? "You can revisit answers before submitting."
                : "Competitive mode only allows forward navigation."}
            </li>
            <li>
              •{" "}
              {difficulty === "competitive"
                ? "Fullscreen and focus monitoring are required for this demo."
                : "Focus monitoring is optional in this mode."}
            </li>
            <li>
              • With monitoring on, tab switches, focus loss, and fullscreen
              exits count as warnings.
            </li>
            <li>
              • After {attemptLimits.violationThreshold} warnings, your answers
              are automatically submitted.
            </li>
            <li>
              • Microphone and speech detection are not active in this frontend
              preview. No audio is recorded.
            </li>
            <li>
              • All three levels currently use the same short question set;
              timing and demo scoring differ.
            </li>
          </ul>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1"
            />
            <span>
              {difficulty === "competitive"
                ? "I agree to fullscreen and browser focus monitoring for this attempt."
                : "Enable browser focus monitoring for this attempt (optional)."}
            </span>
          </label>
          {error && (
            <p role="alert" className="field-error mt-4">
              {error}
            </p>
          )}
          {availability.locked && (
            <p className="form-message mt-5">
              Your daily attempt is complete. Come back tomorrow.
            </p>
          )}
          <div className="mt-7 flex justify-end">
            <Button
              size="lg"
              disabled={
                availability.locked ||
                (difficulty === "competitive" && !consent)
              }
              onClick={start}
            >
              Start assessment
              <ArrowRight />
            </Button>
          </div>
        </Panel>
      </div>
    )
  return (
    <div className="quiz-layout">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{level.name.toUpperCase()} ASSESSMENT</p>
          <h1>{topic.name}</h1>
        </div>
        <div className="text-right">
          <Badge tone={integrity.score > 90 ? "mint" : "amber"}>
            <ShieldCheck size={12} />
            {consent
              ? integrity.score > 90
                ? "Excellent"
                : integrity.score > 80
                  ? "Good"
                  : "At risk"
              : "Monitoring off"}
          </Badge>
          {(preferences.timer || difficulty === "competitive") && (
            <p className="mt-3 flex items-center justify-end gap-2 font-mono text-sm">
              <Clock3 size={14} />
              {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </p>
          )}
        </div>
      </div>
      <div className="muted mb-3 flex justify-between text-xs">
        <span>
          Question {index + 1} of {questions.length}
        </span>
        <span>{answers.filter((a) => a.selected.length).length} answered</span>
      </div>
      <Progress
        value={((index + 1) / questions.length) * 100}
        label="Assessment progress"
      />
      {integrity.warning && (
        <div role="alert" className="subtle-banner mt-5">
          <div className="flex-1">
            {integrity.warning} Warning {integrity.events.warnings} of{" "}
            {attemptLimits.violationThreshold}.
          </div>
          <Button
            variant="outline"
            onClick={() => {
              integrity.dismiss()
              if (difficulty === "competitive" && !document.fullscreenElement)
                void document.documentElement
                  .requestFullscreen()
                  .catch(() => setError("Fullscreen could not be restored."))
            }}
          >
            {difficulty === "competitive" ? <Maximize2 /> : <CheckCircle2 />}
            Continue
          </Button>
        </div>
      )}
      <Panel className="mt-6">
        <Badge>
          {question.type === "multiple"
            ? "SELECT ALL THAT APPLY"
            : question.type === "weighted"
              ? "CHOOSE THE BEST RESPONSE"
              : "SELECT ONE ANSWER"}
        </Badge>
        <h2 className="quiz-question">{question.prompt}</h2>
        {question.context && <p className="muted mb-5">{question.context}</p>}
        {question.code && (
          <CodeBlock code={question.code} language={question.language} />
        )}
        <fieldset>
          <legend className="sr-only">Answer choices</legend>
          {question.options.map((option, i) => (
            <label key={option.id} className="answer-option">
              <input
                type={question.type === "multiple" ? "checkbox" : "radio"}
                name={question.id}
                checked={selected.includes(option.id)}
                onChange={() => choose(option.id)}
              />
              <span>{option.text}</span>
              <span className="answer-key">{String.fromCharCode(65 + i)}</span>
            </label>
          ))}
        </fieldset>
        <div className="quiz-controls">
          <Button
            variant="outline"
            disabled={!level.previous || index === 0}
            onClick={() => navigate(index - 1)}
          >
            <ArrowLeft />
            Previous
          </Button>
          <span className="muted hidden text-xs sm:inline">
            Answers save when you submit.
          </span>
          {index < questions.length - 1 ? (
            <Button onClick={() => navigate(index + 1)}>
              Next question
              <ArrowRight />
            </Button>
          ) : (
            <Button onClick={() => setConfirm(true)}>
              Submit assessment
              <CheckCircle2 />
            </Button>
          )}
        </div>
      </Panel>
      <div className="quiz-controls">
        <div className="question-nav" aria-label="Question navigation">
          {questions.map((q, i) => (
            <button
              key={q.id}
              disabled={!level.previous && i !== index}
              aria-label={`Question ${i + 1}`}
              aria-current={index === i}
              data-answered={Boolean(
                answers.find((a) => a.questionId === q.id)?.selected.length
              )}
              onClick={() => navigate(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <span className="muted text-xs">
          Demo session · No audio monitoring
        </span>
      </div>
      {error && (
        <p role="alert" className="field-error mt-4">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={submit}
        title="Ready to submit?"
        description={`${answers.filter((a) => a.selected.length).length} of ${questions.length} questions answered. Unanswered questions receive zero points. Your answers cannot be changed after submission.`}
        confirmLabel="Submit assessment"
      />
    </div>
  )
}
