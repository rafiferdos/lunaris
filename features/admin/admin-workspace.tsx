"use client"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "@/components/shared/app-link"
import { useSession } from "@/features/auth/auth-boundary"
import { apiFor, unwrap } from "@/lib/api/client"
import { queries, privateKey, invalidateProgress } from "@/lib/api/queries"
import type { Assessment, GetResponse } from "@/lib/api/types"
import type { paths } from "@/lib/api/schema"
import { useCursor } from "@/hooks/use-cursor"
import {
  PageHeader,
  Panel,
  EmptyState,
  Select,
  Badge,
} from "@/components/shared/ui"
import { QueryState, MutationError } from "@/components/shared/query-state"
import { CursorPagination } from "@/components/shared/cursor-pagination"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { dateTime } from "@/lib/format"
type QuestionRow = GetResponse<"/api/v1/admin/questions">["data"][number]
type Policy =
  paths["/api/v1/admin/assessment-configs/{id}"]["put"]["requestBody"]["content"]["application/json"]
export function AdminWorkspace() {
  const { user } = useSession()
  if (user.role !== "ADMIN")
    return (
      <EmptyState
        title="Administrator access required"
        description="Only administrators can manage assessment content."
      />
    )
  return (
    <>
      <PageHeader
        eyebrow="CONTENT OPERATIONS"
        title="Question bank"
        description="Manage immutable question versions, future assessment settings and the audit trail."
        action={
          <Button
            nativeButton={false}
            render={<Link href="/admin/questions/import" />}
          >
            Import questions
          </Button>
        }
      />
      <Tabs defaultValue="questions">
        <TabsList className="mb-6">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="configs">Assessment settings</TabsTrigger>
          <TabsTrigger value="audit">Audit trail</TabsTrigger>
        </TabsList>
        <TabsContent value="questions">
          <Questions />
        </TabsContent>
        <TabsContent value="configs">
          <Configurations />
        </TabsContent>
        <TabsContent value="audit">
          <Audit />
        </TabsContent>
      </Tabs>
    </>
  )
}
function Questions() {
  const { user } = useSession(),
    pagination = useCursor()
  const query = useQuery({
    queryKey: [...privateKey(user.id), "admin-questions", pagination.cursor],
    queryFn: ({ signal }) =>
      unwrap(
        apiFor(user.id).GET("/api/v1/admin/questions", {
          signal,
          params: { query: { limit: 20, cursor: pagination.cursor } },
        })
      ),
  })
  if (!query.data)
    return <QueryState error={query.error} retry={query.refetch} />
  return (
    <Panel>
      {!query.data.data.length ? (
        <EmptyState
          title="No questions yet"
          description="Import your first versioned question batch."
        />
      ) : (
        <Accordion>
          {query.data.data.map((row) => (
            <AccordionItem key={row.id} value={row.id}>
              <AccordionTrigger>
                <span className="min-w-0 text-left break-words">
                  {row.question.prompt}
                  <span className="muted mt-2 block text-xs">
                    {row.question.questionKey} · {row.question.topicSlug} · v
                    {row.question.version} · {row.status}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <QuestionVersion row={row} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      <CursorPagination
        page={pagination.page}
        pending={query.isFetching}
        hasNext={!!query.data.meta.nextCursor}
        previous={pagination.previous}
        next={() => pagination.next(query.data?.meta.nextCursor)}
      />
    </Panel>
  )
}
function QuestionVersion({ row }: { row: QuestionRow }) {
  const { user } = useSession(),
    client = useQueryClient()
  const [status, setStatus] = useState(row.status),
    [confirm, setConfirm] = useState(false)
  const mutation = useMutation({
    mutationFn: () =>
      unwrap(
        apiFor(user.id).PATCH("/api/v1/admin/questions/{id}/publication", {
          params: { path: { id: row.id } },
          body: { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" },
        })
      ),
    onSuccess: async () => {
      await Promise.all([
        invalidateProgress(client, user.id),
        client.invalidateQueries({
          queryKey: [...privateKey(user.id), "admin-audit"],
        }),
      ])
    },
  })
  return (
    <div className="space-y-4">
      <p className="muted text-xs break-words">
        {row.question.questionKey} · {row.question.type} ·{" "}
        {row.question.difficulty}
      </p>
      <ul className="space-y-2">
        {row.question.options.map((option) => (
          <li key={option.id} className="rounded-lg border p-3 break-words">
            {option.text}{" "}
            <Badge>
              {"quality" in option
                ? option.quality
                : option.isCorrect
                  ? "Correct"
                  : "Distractor"}
            </Badge>
          </li>
        ))}
      </ul>
      <p className="text-sm break-words">{row.question.explanation}</p>
      <fieldset
        disabled={mutation.isPending}
        className="flex flex-wrap items-center gap-3"
      >
        <Select
          label={`Publication for ${row.question.questionKey}`}
          value={status}
          onChange={setStatus}
          options={["DRAFT", "PUBLISHED", "ARCHIVED"]}
        />
        <Button
          disabled={mutation.isPending || status === row.status}
          onClick={() => setConfirm(true)}
        >
          Update publication
        </Button>
      </fieldset>
      <MutationError error={mutation.error} />
      {mutation.isSuccess && <p role="status">Publication updated.</p>}
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => mutation.mutate()}
        title="Update question publication?"
        description="This changes selection for future assessments. Existing attempts keep their original question snapshots."
        confirmLabel="Update publication"
      />
    </div>
  )
}
function Configurations() {
  const { user } = useSession(),
    catalog = useQuery(queries.assessments(user.id))
  const [selected, setSelected] = useState("")
  if (!catalog.data)
    return <QueryState error={catalog.error} retry={catalog.refetch} />
  const all = catalog.data.flatMap((topic) =>
    topic.modes.map((mode) => ({ topic: topic.name, mode }))
  )
  const chosen = all.find((value) => value.mode.id === selected) ?? all[0]
  if (!chosen)
    return (
      <EmptyState
        title="No assessment settings"
        description="Create an assessment catalog before configuring modes."
      />
    )
  return (
    <Panel>
      <Select
        label="Assessment configuration"
        value={chosen.mode.id}
        onChange={setSelected}
        options={all.map((value) => ({
          value: value.mode.id,
          label: `${value.topic} · ${value.mode.mode}`,
        }))}
      />
      <PolicyForm key={chosen.mode.id} mode={chosen.mode} />
    </Panel>
  )
}
function PolicyForm({ mode }: { mode: Assessment["modes"][number] }) {
  const { user } = useSession(),
    client = useQueryClient()
  const [draft, setDraft] = useState<Policy>({
    questionCount: mode.questionCount,
    durationSeconds: mode.durationSeconds,
    distribution: mode.distribution,
    editable: mode.editable,
    backNavigation: mode.backNavigation,
    ranked: mode.ranked,
    enabled: mode.enabled,
    scoringVersion: mode.scoringVersion,
    xpVersion: mode.xpVersion,
    ratingVersion: mode.ratingVersion,
    integrityVersion: mode.integrityVersion,
  })
  const [confirm, setConfirm] = useState(false),
    [message, setMessage] = useState("")
  const mutation = useMutation({
    mutationFn: () =>
      unwrap(
        apiFor(user.id).PUT("/api/v1/admin/assessment-configs/{id}", {
          params: { path: { id: mode.id } },
          body: draft,
        })
      ),
    onSuccess: async () => {
      await invalidateProgress(client, user.id)
    },
  })
  function validate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      !Number.isInteger(draft.questionCount) ||
      draft.questionCount < 1 ||
      draft.questionCount > 100 ||
      !Number.isInteger(draft.durationSeconds) ||
      draft.durationSeconds < 30 ||
      draft.durationSeconds > 7200 ||
      Object.values(draft.distribution).some(
        (value) => !Number.isFinite(value) || value < 0
      ) ||
      Object.values(draft.distribution).reduce(
        (sum, value) => sum + value,
        0
      ) <= 0
    ) {
      setMessage(
        "Use 1–100 questions, 30–7200 seconds and nonnegative difficulty weights with a positive total."
      )
      return
    }
    setMessage("")
    setConfirm(true)
  }
  return (
    <form className="mt-6 space-y-6" onSubmit={validate} noValidate>
      <fieldset disabled={mutation.isPending} className="space-y-6">
        <div className="form-grid">
          {(
            [
              { key: "questionCount", label: "Question count" },
              { key: "durationSeconds", label: "Duration (seconds)" },
            ] as const
          ).map((field) => (
            <Label className="field" key={field.key}>
              {field.label}
              <Input
                type="number"
                value={draft[field.key]}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    [field.key]: Number(event.target.value),
                  })
                }
              />
            </Label>
          ))}
        </div>
        <fieldset>
          <legend className="mb-3">Difficulty weights</legend>
          <div className="form-grid">
            {(["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"] as const).map(
              (key) => (
                <Label className="field" key={key}>
                  {key}
                  <Input
                    type="number"
                    min={0}
                    value={draft.distribution[key]}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        distribution: {
                          ...draft.distribution,
                          [key]: Number(event.target.value),
                        },
                      })
                    }
                  />
                </Label>
              )
            )}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-6">
          {(
            [
              { key: "enabled", label: "Enabled" },
              { key: "ranked", label: "Ranked rewards" },
              { key: "editable", label: "Editable answers" },
              { key: "backNavigation", label: "Back navigation" },
            ] as const
          ).map((field) => (
            <Label key={field.key} className="flex items-center gap-2">
              <Switch
                checked={draft[field.key]}
                onCheckedChange={(value) =>
                  setDraft({ ...draft, [field.key]: value })
                }
              />
              {field.label}
            </Label>
          ))}
        </div>
        <p className="muted text-sm">
          Saved settings apply only to new attempts. Published question supply
          must meet the question count.
        </p>
        {message && <p role="alert">{message}</p>}
        <MutationError error={mutation.error} />
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save assessment settings"}
        </Button>
      </fieldset>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => mutation.mutate()}
        title="Update assessment settings?"
        description="New attempts will use these settings. Existing attempts and results remain unchanged."
        confirmLabel="Save settings"
      />
    </form>
  )
}
function Audit() {
  const { user } = useSession(),
    pagination = useCursor()
  const query = useQuery({
    queryKey: [...privateKey(user.id), "admin-audit", pagination.cursor],
    queryFn: ({ signal }) =>
      unwrap(
        apiFor(user.id).GET("/api/v1/admin/audit", {
          signal,
          params: { query: { limit: 20, cursor: pagination.cursor } },
        })
      ),
  })
  if (!query.data)
    return <QueryState error={query.error} retry={query.refetch} />
  return (
    <Panel>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time (UTC)</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.data.data.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{dateTime(row.createdAt)}</TableCell>
              <TableCell>{row.action}</TableCell>
              <TableCell className="max-w-64 break-all whitespace-normal">
                {row.target}
              </TableCell>
              <TableCell className="max-w-64 break-all whitespace-normal">
                {JSON.stringify(row.metadata)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!query.data.data.length && (
        <EmptyState
          title="No administrative changes yet"
          description="Imports and configuration changes will appear here."
        />
      )}
      <CursorPagination
        page={pagination.page}
        pending={query.isFetching}
        hasNext={!!query.data.meta.nextCursor}
        previous={pagination.previous}
        next={() => pagination.next(query.data?.meta.nextCursor)}
      />
    </Panel>
  )
}
