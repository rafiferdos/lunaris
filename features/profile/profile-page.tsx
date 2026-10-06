"use client"
import { useState } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { PageHeader, Panel, Avatar, Metric } from "@/components/shared/ui"
import { Button } from "@/components/ui/button"
import { MutationError, QueryState } from "@/components/shared/query-state"
import { useWorkspace } from "@/features/workspace/workspace-provider"
import { queries, privateKey } from "@/lib/api/queries"
import { apiFor, unwrap } from "@/lib/api/client"
import { profileSchema, type ProfileDraft } from "./profile-service"
import { dateTime } from "@/lib/format"
export function ProfilePage() {
  const { profile } = useWorkspace(),
    client = useQueryClient()
  const overviewQuery = useQuery(queries.overview(profile.id)),
    catalog = useQuery(queries.assessments(profile.id))
  const overview = overviewQuery.data,
    assessments = catalog.data ?? []
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState<ProfileDraft>({
      displayName: profile.displayName,
      username: profile.username ?? "",
      bio: profile.bio,
      country: profile.country ?? "",
      timezone: profile.timezone,
      preferredTopics: profile.preferredTopics,
    }),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [message, setMessage] = useState("")
  const mutation = useMutation({
    mutationFn: async (data: ProfileDraft) =>
      (
        await unwrap(
          apiFor(profile.id).PATCH("/api/v1/me", {
            body: {
              ...data,
              username: data.username || null,
              country: data.country || null,
            },
          })
        )
      ).data,
    onSuccess: async (data) => {
      client.setQueryData(queries.profile(profile.id).queryKey, data)
      await client.invalidateQueries({
        queryKey: privateKey(profile.id),
        predicate: (q) => q.queryKey[2] === "rankings",
      })
      setEditing(false)
      setMessage("Profile saved to your account.")
    },
  })
  function save(e: React.FormEvent) {
    e.preventDefault()
    const parsed = profileSchema.safeParse(draft)
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [i.path.join("."), i.message])
        )
      )
      return
    }
    setErrors({})
    mutation.mutate(parsed.data)
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR PERSONAL WORKSPACE"
        title="My profile"
        description="A little about you and the skills you’re building."
        action={
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => {
              setDraft({
                ...profile,
                username: profile.username ?? "",
                country: profile.country ?? "",
              })
              setEditing(!editing)
              setErrors({})
              setMessage("")
            }}
          >
            {editing ? "Cancel editing" : "Edit profile"}
          </Button>
        }
      />
      <div className="two-column">
        <Panel>
          <div className="flex items-center gap-5">
            <Avatar name={profile.displayName} />
            <div>
              <h2>{profile.displayName}</h2>
              <p className="muted">
                {profile.username ? `@${profile.username}` : profile.email}
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm leading-7">
            {profile.bio || "Add a short bio to introduce yourself."}
          </p>
          <p className="muted mt-5 text-xs">
            {profile.country ?? "Country not set"} · {profile.timezone} · Joined{" "}
            {dateTime(profile.joinedAt)}
          </p>
          {overview ? (
            <div className="metric-grid mt-7">
              <Metric label="Rating" value={overview.rating} />
              <Metric
                label="Global rank"
                value={overview.rank ? `#${overview.rank}` : "Unranked"}
              />
              <Metric label="Assessments" value={overview.assessmentCount} />
              <Metric label="Streak" value={`${overview.currentStreak} days`} />
            </div>
          ) : (
            <QueryState
              error={overviewQuery.error}
              retry={overviewQuery.refetch}
            />
          )}
        </Panel>
        <Panel>
          <h3>Preferred skill areas</h3>
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.preferredTopics.length ? (
              profile.preferredTopics.map((t) => (
                <span className="badge" key={t}>
                  {assessments.find((a) => a.slug === t)?.name ?? t}
                </span>
              ))
            ) : (
              <p className="muted">
                Edit your profile to choose your focus areas.
              </p>
            )}
          </div>
          <p className="muted mt-7 text-sm">Email: {profile.email}</p>
        </Panel>
      </div>
      {editing && (
        <Panel className="section-space">
          <form onSubmit={save} noValidate>
            <fieldset disabled={mutation.isPending}>
              <div className="form-grid">
                {(
                  [
                    { key: "displayName", label: "Display name" },
                    { key: "username", label: "Username" },
                    { key: "country", label: "Country code" },
                    { key: "timezone", label: "Timezone" },
                    { key: "bio", label: "Short bio" },
                  ] as const
                ).map(({ key, label }) => (
                  <Label className="field" key={key}>
                    {label}
                    {key === "bio" ? (
                      <Textarea
                        value={draft[key]}
                        onChange={(e) =>
                          setDraft({ ...draft, [key]: e.target.value })
                        }
                        aria-invalid={!!errors[key]}
                      />
                    ) : (
                      <Input
                        value={draft[key]}
                        onChange={(e) =>
                          setDraft({ ...draft, [key]: e.target.value })
                        }
                        aria-invalid={!!errors[key]}
                      />
                    )}{" "}
                    {errors[key] && (
                      <span className="field-error" role="alert">
                        {errors[key]}
                      </span>
                    )}
                  </Label>
                ))}
              </div>
              <fieldset className="mt-6">
                <legend className="mb-4">Preferred topics</legend>
                <div className="flex flex-wrap gap-5">
                  {catalog.error && (
                    <QueryState error={catalog.error} retry={catalog.refetch} />
                  )}
                  {assessments.map((t) => (
                    <Label key={t.id} className="flex gap-2">
                      <Checkbox
                        checked={draft.preferredTopics.includes(t.slug)}
                        onCheckedChange={(checked) =>
                          setDraft({
                            ...draft,
                            preferredTopics: checked
                              ? [...draft.preferredTopics, t.slug]
                              : draft.preferredTopics.filter(
                                  (s) => s !== t.slug
                                ),
                          })
                        }
                      />
                      {t.name}
                    </Label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-6">
                <MutationError error={mutation.error} />
                <Button
                  className="mt-4"
                  type="submit"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </fieldset>
          </form>
        </Panel>
      )}
      {message && (
        <p role="status" className="form-message mt-5">
          {message}
        </p>
      )}
    </>
  )
}
