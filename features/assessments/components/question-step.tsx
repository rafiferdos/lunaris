"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Panel, Badge } from "@/components/shared/ui"
import { CodeBlock } from "@/components/shared/code-block"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { MutationError } from "@/components/shared/query-state"
import type { ServerQuestion, ServerAttempt } from "@/lib/api/types"
import { useSession } from "@/features/auth/auth-boundary"
import {
  useNavigationSave,
  useNavigationPending,
} from "@/components/shared/navigation-guard"
export function QuestionStep({
  question,
  index,
  total,
  editable,
  backNavigation,
  disabled,
  save,
  navigate,
  submit,
}: {
  question: ServerQuestion
  index: number
  total: number
  editable: boolean
  backNavigation: boolean
  disabled: boolean
  save: (selected: string[], responseTimeMs: number) => Promise<ServerAttempt>
  navigate: (index: number) => void
  submit: () => Promise<unknown>
}) {
  const { user } = useSession()
  const navigating = useNavigationPending()
  const draftKey = `lunaris:draft:${user.id}:${question.id}`
  const [selected, setSelected] = useState<string[]>(() => {
      if (!editable && question.answered) return question.selected
      try {
        const value: unknown = JSON.parse(
          sessionStorage.getItem(draftKey) ?? "null"
        )
        if (
          Array.isArray(value) &&
          value.every(
            (id) =>
              typeof id === "string" &&
              question.options.some((o) => o.id === id)
          ) &&
          (question.type === "MULTIPLE_CHOICE" || value.length <= 1)
        )
          return [...new Set(value)]
      } catch {}
      return question.selected
    }),
    [status, setStatus] = useState(
      JSON.stringify(selected) === JSON.stringify(question.selected)
        ? "Saved"
        : "Restored unsaved answer"
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [confirm, setConfirm] = useState<"submit" | "skip" | null>(null)
  const started = useRef<number | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    pending = useRef<Promise<unknown> | null>(null),
    saved = useRef(JSON.stringify(question.selected)),
    committed = useRef(question.answered),
    acting = useRef(false)
  useEffect(() => {
    started.current = Date.now()
  }, [])
  const locked = !editable && question.answered
  const persist = useCallback(
    async (value: string[]) => {
      if (pending.current) await pending.current.catch(() => {})
      if (committed.current && saved.current === JSON.stringify(value)) return
      setStatus("Saving…")
      const request = save(
        value,
        Math.min(
          7_200_000,
          Math.max(0, Date.now() - (started.current ?? Date.now()))
        )
      )
      pending.current = request
      try {
        const result = await request
        saved.current = JSON.stringify(value)
        try {
          if (sessionStorage.getItem(draftKey) === saved.current)
            sessionStorage.removeItem(draftKey)
        } catch {}
        committed.current = true
        setStatus("Saved")
        setError(null)
        return result
      } finally {
        if (pending.current === request) pending.current = null
      }
    },
    [save, draftKey]
  )
  useEffect(() => {
    if (!editable || disabled || JSON.stringify(selected) === saved.current)
      return
    timer.current = setTimeout(() => {
      void persist(selected).catch((e) => {
        setStatus("Not saved")
        setError(e)
      })
    }, 500)
    return () => clearTimeout(timer.current)
  }, [selected, editable, disabled, persist])
  useNavigationSave(async () => {
    clearTimeout(timer.current)
    if (
      !editable ||
      pending.current ||
      JSON.stringify(selected) !== saved.current
    )
      await persist(selected)
    if (!editable) await submit()
  }, !editable)
  function select(value: string[]) {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(value))
    } catch {}
    setStatus("Unsaved changes")
    setSelected(value)
  }
  async function act(destination: number | "submit") {
    if (acting.current) return
    acting.current = true
    clearTimeout(timer.current)
    setBusy(true)
    setError(null)
    try {
      const result = await persist(selected)
      if (!result || result.status === "IN_PROGRESS") {
        if (destination === "submit") await submit()
        else navigate(destination)
      }
    } catch (e) {
      setError(e)
      setStatus("Not saved")
    } finally {
      acting.current = false
      setBusy(false)
      setConfirm(null)
    }
  }
  function next() {
    if (index === total - 1) setConfirm("submit")
    else if (!editable && !selected.length && !locked) setConfirm("skip")
    else void act(index + 1)
  }
  const isDisabled = disabled || busy || navigating || locked
  return (
    <>
      <Panel>
        <Badge>
          Question {index + 1} of {total} · {question.type.replaceAll("_", " ")}
        </Badge>
        <h2 className="quiz-question">{question.prompt}</h2>
        {question.context && <p className="muted mb-5">{question.context}</p>}
        {question.code && (
          <CodeBlock code={question.code} language={question.language} />
        )}
        {question.type === "MULTIPLE_CHOICE" ? (
          <fieldset disabled={isDisabled}>
            <legend className="sr-only">Select all that apply</legend>
            {question.options.map((option, i) => (
              <Label className="answer-option" key={option.id}>
                <Checkbox
                  checked={selected.includes(option.id)}
                  disabled={isDisabled}
                  onCheckedChange={(checked) => {
                    select(
                      checked
                        ? [...selected, option.id]
                        : selected.filter((id) => id !== option.id)
                    )
                  }}
                />
                <span>{option.text}</span>
                <span className="answer-key">
                  {String.fromCharCode(65 + i)}
                </span>
              </Label>
            ))}
          </fieldset>
        ) : (
          <RadioGroup
            aria-label="Answer choices"
            value={selected[0] ?? ""}
            disabled={isDisabled}
            onValueChange={(value) => {
              select([String(value)])
            }}
          >
            {question.options.map((option, i) => (
              <Label className="answer-option" key={option.id}>
                <RadioGroupItem value={option.id} disabled={isDisabled} />
                <span>{option.text}</span>
                <span className="answer-key">
                  {String.fromCharCode(65 + i)}
                </span>
              </Label>
            ))}
          </RadioGroup>
        )}
        {!locked && selected.length > 0 && (
          <Button
            className="mt-3"
            variant="ghost"
            size="sm"
            disabled={disabled || busy}
            onClick={() => {
              select([])
            }}
          >
            Clear selection
          </Button>
        )}
        <div className="quiz-controls">
          <Button
            variant="outline"
            disabled={!backNavigation || index === 0 || busy || disabled}
            onClick={() => void act(index - 1)}
          >
            Previous
          </Button>
          <span role="status" className="muted text-xs">
            {locked
              ? "Answer committed"
              : editable
                ? status
                : "Commits when you continue"}
          </span>
          <Button disabled={busy || disabled} onClick={next}>
            {busy
              ? "Saving…"
              : index === total - 1
                ? "Submit assessment"
                : "Next question"}
          </Button>
        </div>
        <MutationError error={error} />
      </Panel>
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          void act(confirm === "submit" ? "submit" : index + 1)
        }}
        title={confirm === "skip" ? "Skip this question?" : "Ready to submit?"}
        description={
          confirm === "skip"
            ? "This skip will be committed and cannot be changed. Skipped questions receive the lowest applicable score."
            : "Your saved answers will be finalized. Unanswered questions receive the lowest applicable score, including negative points where configured. Results cannot be changed."
        }
        confirmLabel={confirm === "skip" ? "Commit skip" : "Submit assessment"}
      />
    </>
  )
}
