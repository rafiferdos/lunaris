"use client"
import { useState } from "react"
import { Upload, FileJson, CheckCircle2 } from "lucide-react"
import { PageHeader, Panel, Metric, Badge } from "@/components/shared/ui"
import { Button } from "@/components/ui/button"
import {
  questionSchema,
  questionImportSchema,
  type Question,
} from "../schemas/question"
import { CodeBlock } from "@/components/shared/code-block"
export function QuestionImport({ example }: { example: Question[] }) {
  const [input, setInput] = useState("")
  const [valid, setValid] = useState<Question[]>([])
  const [issues, setIssues] = useState<string[]>([])
  const [validated, setValidated] = useState(false)
  const [count, setCount] = useState(0)
  function validate() {
    setValidated(true)
    setValid([])
    setIssues([])
    setCount(0)
    try {
      const parsed: unknown = JSON.parse(input)
      if (!Array.isArray(parsed)) {
        setIssues(["Root: expected a JSON array of questions."])
        return
      }
      setCount(parsed.length)
      if (parsed.length > 1000) {
        setIssues(["Import is limited to 1,000 questions per preview."])
        return
      }
      const accepted: Question[] = []
      const errors: string[] = []
      const ids = new Set<string>()
      parsed.forEach((record, index) => {
        const result = questionSchema.safeParse(record)
        if (result.success) {
          if (ids.has(result.data.id)) {
            errors.push(
              `Record ${index + 1}: duplicate question ID ${result.data.id}`
            )
          } else {
            ids.add(result.data.id)
            accepted.push(result.data)
          }
        } else
          result.error.issues.forEach((issue) =>
            errors.push(
              `Record ${index + 1} · ${issue.path.join(".")}: ${issue.message}`
            )
          )
      })
      if (!parsed.length) errors.push("Add at least one question.")
      setValid(accepted)
      setIssues(errors)
      if (!errors.length) questionImportSchema.parse(accepted)
    } catch (error) {
      setIssues([
        error instanceof SyntaxError
          ? `Invalid JSON: ${error.message}`
          : "The question file could not be validated.",
      ])
    }
  }
  async function upload(file?: File) {
    if (!file) return
    if (file.size > 2_000_000) {
      setIssues(["Choose a JSON file smaller than 2 MB."])
      setValidated(false)
      return
    }
    try {
      setInput(await file.text())
      setValidated(false)
      setIssues([])
    } catch {
      setIssues(["The file could not be read. Try pasting the JSON instead."])
    }
  }
  function counts(key: "category" | "topic" | "difficulty" | "type") {
    return Object.entries(
      valid.reduce<Record<string, number>>(
        (acc, q) => ({ ...acc, [q[key]]: (acc[q[key]] ?? 0) + 1 }),
        {}
      )
    )
      .map(([label, total]) => `${label}: ${total}`)
      .join(" · ")
  }
  return (
    <>
      <PageHeader
        eyebrow="DEVELOPER TOOLS · FRONTEND ONLY"
        title="Question import preview"
        description="Validate a question set, inspect its shape, and catch problems before it reaches your bank."
      />
      <div className="subtle-banner mb-6">
        <FileJson size={18} />
        This preview is public in the demo. It does not write to a database.
        Backend admin authorization will be required.
      </div>
      <div className="two-column">
        <Panel>
          <div className="panel-title">
            <h3>Question JSON</h3>
            <Button
              variant="outline"
              onClick={() => {
                setInput(JSON.stringify(example, null, 2))
                setValidated(false)
                setIssues([])
              }}
            >
              Load example
            </Button>
          </div>
          <label className="sr-only" htmlFor="question-json">
            Question JSON
          </label>
          <textarea
            id="question-json"
            className="json-input"
            spellCheck={false}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setValidated(false)
            }}
            placeholder='[{ "id": "javascript-1", "type": "single", ... }]'
          />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <label className="outline-link cursor-pointer">
              <Upload size={14} />
              Upload .json
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => void upload(e.target.files?.[0])}
              />
            </label>
            <Button onClick={validate}>
              Validate questions
              <CheckCircle2 />
            </Button>
          </div>
        </Panel>
        <Panel>
          <h3>Import summary</h3>
          <p className="muted mt-2 mb-6 text-sm">
            Maximum 1,000 questions / 2 MB. Single-choice, multiple-choice, and
            weighted scenarios are supported.
          </p>
          {validated && (
            <>
              <div className="metric-grid !grid-cols-3">
                <Metric label="Records" value={count} />
                <Metric label="Valid" value={valid.length} />
                <Metric label="Invalid" value={count - valid.length} />
              </div>
              <div className="muted mt-6 space-y-3 text-xs">
                {(["category", "topic", "difficulty", "type"] as const).map(
                  (key) => (
                    <p key={key}>
                      <strong className="text-foreground capitalize">
                        {key}:
                      </strong>{" "}
                      {counts(key) || "—"}
                    </p>
                  )
                )}
              </div>
            </>
          )}
          {issues.length > 0 && (
            <div role="alert" className="import-errors mt-5">
              <h3>Validation details</h3>
              <ul>
                {issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {validated && !issues.length && (
            <p className="form-message mt-6">
              All records are valid. Preview only; nothing has been imported.
            </p>
          )}
          <details className="mt-6 text-xs">
            <summary className="cursor-pointer">
              Question format requirements
            </summary>
            <p className="muted mt-3 leading-6">
              Required: id, topic, category, difficulty, type, prompt, options,
              tags, explanation, estimatedTimeSeconds, active, and version.
              Choice options include id, text, and correct. Weighted options use
              quality and weight instead. IDs must be unique; a single-choice
              question needs exactly one correct option.
            </p>
          </details>
        </Panel>
      </div>
      {validated && valid.length > 0 && (
        <section className="section-space">
          <h2 className="mb-5">Valid question preview</h2>
          {valid.map((question) => (
            <details className="review-row" key={question.id}>
              <summary>
                <span className="flex-1">{question.prompt}</span>
                <Badge>{question.type}</Badge>
              </summary>
              <div className="review-body">
                <p className="muted">
                  {question.topic} · {question.difficulty}
                </p>
                {question.code && (
                  <CodeBlock
                    code={question.code}
                    language={question.language}
                  />
                )}
                <ul className="mt-4 space-y-2">
                  {question.options.map((option) => (
                    <li key={option.id}>
                      {option.text}{" "}
                      <Badge>
                        {"correct" in option
                          ? option.correct
                            ? "Correct"
                            : "Distractor"
                          : `${option.quality} · ${option.weight}`}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <p className="review-explanation">{question.explanation}</p>
              </div>
            </details>
          ))}
        </section>
      )}
    </>
  )
}
