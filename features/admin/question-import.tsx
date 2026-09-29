"use client"
import { useState } from "react"
import { z } from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageHeader, Panel, Metric, EmptyState } from "@/components/shared/ui"
import { MutationError } from "@/components/shared/query-state"
import { useSession } from "@/features/auth/auth-boundary"
import { api, unwrap } from "@/lib/api/client"
import { invalidateProgress } from "@/lib/api/queries"
import {
  importDocumentSchema,
  importExample,
} from "@/features/admin/import-schema"
const envelope = z.strictObject({
  schemaVersion: z.literal(1),
  questions: z.array(z.unknown()).min(1).max(1000),
})
export function QuestionImport() {
  const { user } = useSession(),
    client = useQueryClient()
  const [input, setInput] = useState(""),
    [validatedInput, setValidatedInput] = useState(""),
    [error, setError] = useState("")
  const validation = useMutation({
    mutationFn: async (text: string) => {
      const body = envelope.parse(JSON.parse(text))
      return (
        await unwrap(
          api.POST("/api/v1/admin/questions/import/validate", { body })
        )
      ).data
    },
    onSuccess: (_, text) => setValidatedInput(text),
  })
  const mutation = useMutation({
    mutationFn: async () =>
      (
        await unwrap(
          api.POST("/api/v1/admin/questions/import", {
            body: importDocumentSchema.parse(JSON.parse(input)),
          })
        )
      ).data,
    onSuccess: () => invalidateProgress(client, user.id),
  })
  function edit(text: string) {
    setInput(text)
    setError("")
    mutation.reset()
  }
  async function upload(file?: File) {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError("Choose a JSON file smaller than 2 MB.")
      return
    }
    try {
      edit(await file.text())
    } catch {
      setError("Could not read that file.")
    }
  }
  function validate() {
    try {
      if (new TextEncoder().encode(input).length > 2 * 1024 * 1024)
        throw new Error("Import must be smaller than 2 MB.")
      envelope.parse(JSON.parse(input))
      setError("")
      validation.mutate(input)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON")
    }
  }
  if (user.role !== "ADMIN")
    return (
      <EmptyState
        title="Administrator access required"
        description="Only administrators can manage the question bank."
      />
    )
  const report = validatedInput === input ? validation.data : undefined
  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Question import"
        description="Validate a versioned JSON batch, then import it atomically into your question bank."
      />
      <div className="two-column">
        <Panel>
          <div className="panel-title">
            <h3>Question JSON</h3>
            <Button
              variant="outline"
              onClick={() => edit(JSON.stringify(importExample, null, 2))}
            >
              Load example
            </Button>
          </div>
          <Label htmlFor="question-json" className="sr-only">
            Question JSON
          </Label>
          <Textarea
            id="question-json"
            className="json-input"
            spellCheck={false}
            value={input}
            onChange={(e) => edit(e.target.value)}
            disabled={mutation.isPending}
          />
          <Label className="field mt-5">
            Upload JSON
            <Input
              type="file"
              accept="application/json,.json"
              onChange={(e) => void upload(e.target.files?.[0])}
              disabled={mutation.isPending}
            />
          </Label>
          <div className="mt-5 flex gap-3">
            <Button
              onClick={validate}
              disabled={validation.isPending || mutation.isPending || !input}
            >
              {validation.isPending ? "Validating…" : "Validate batch"}
            </Button>
            <Button
              variant="outline"
              disabled={
                !report?.valid || mutation.isPending || mutation.isSuccess
              }
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Importing…" : "Import validated batch"}
            </Button>
          </div>
        </Panel>
        <Panel>
          <h3>Validation report</h3>
          {error && (
            <Alert className="mt-5" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <MutationError error={validation.error} />
          <MutationError error={mutation.error} />
          {report && (
            <>
              <div className="metric-grid mt-5">
                <Metric label="New questions" value={report.created} />
                <Metric label="Already imported" value={report.alreadyExists} />
              </div>
              <p role="status" className="mt-5">
                {report.valid
                  ? "Batch is valid. Ready to import."
                  : "Batch rejected. Correct these issues and validate again."}
              </p>
              <ul className="mt-5 space-y-3">
                {report.errors.map((issue, i) => (
                  <li className="text-sm" key={i}>
                    {issue.questionIndex == null
                      ? "Root"
                      : `Question ${issue.questionIndex + 1}`}{" "}
                    · {issue.path}: {issue.message}
                  </li>
                ))}
              </ul>
            </>
          )}
          {mutation.data && (
            <Alert className="mt-5">
              <AlertDescription>
                Import complete: {mutation.data.created} created,{" "}
                {mutation.data.alreadyExists} already existed. Batch{" "}
                {mutation.data.batchId}.
              </AlertDescription>
            </Alert>
          )}
          <p className="muted mt-6 text-sm">
            Existing question content is immutable. Increment the version to
            change content. The example is a draft and does not enter active
            assessments until published.
          </p>
        </Panel>
      </div>
    </>
  )
}
