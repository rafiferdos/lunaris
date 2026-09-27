"use client"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { MapPin, CalendarDays, Pencil, Check } from "lucide-react"
import {
  PageHeader,
  Panel,
  Avatar,
  Metric,
  Progress,
} from "@/components/shared/ui"
import { PageEntrance } from "@/components/shared/motion"
import { Button } from "@/components/ui/button"
import { writeLocal } from "@/lib/local-store"
import { useAttempts } from "@/features/history/use-attempts"
import { statsService } from "@/features/stats/stats-service"
import { useProfile } from "./use-profile"
import { profileSchema, type Profile } from "./profile-service"
export function ProfilePage() {
  const profile = useProfile()
  const attempts = useAttempts()
  const stats = statsService.getOverview(attempts)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Profile>(profile)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  function save(event: React.FormEvent) {
    event.preventDefault()
    const parsed = profileSchema.safeParse(draft)
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ])
        )
      )
      return
    }
    try {
      writeLocal("lunaris:profile", parsed.data)
      setEditing(false)
      setMessage("Profile updated on this device.")
      setErrors({})
    } catch {
      setMessage(
        "Could not save your profile. Check browser storage permissions."
      )
    }
  }
  return (
    <PageEntrance>
      <PageHeader
        eyebrow="YOUR PERSONAL WORKSPACE"
        title="My profile"
        description="A little about you and the skills you’re building."
        action={
          <Button
            variant="outline"
            onClick={() => {
              setDraft(profile)
              setEditing(!editing)
              setErrors({})
            }}
          >
            <Pencil size={14} />
            {editing ? "Cancel editing" : "Edit profile"}
          </Button>
        }
      />
      <div className="two-column">
        <Panel>
          <div className="flex items-center gap-5">
            <div className="mx-3 scale-150">
              <Avatar name={profile.name} />
            </div>
            <div>
              <h2>{profile.name}</h2>
              <p className="muted text-sm">@{profile.username}</p>
            </div>
          </div>
          <p className="muted mt-7 max-w-lg text-sm leading-7">{profile.bio}</p>
          <div className="muted mt-5 flex flex-wrap gap-5 text-xs">
            <span className="flex gap-2">
              <MapPin size={14} />
              {profile.country}
            </span>
            <span className="flex gap-2">
              <CalendarDays size={14} />
              Joined June 2026
            </span>
          </div>
          <Separator className="my-7" />
          <div className="metric-grid">
            <Metric label="Rating" value={stats.rating.toLocaleString()} />
            <Metric label="Global rank" value="#128" />
            <Metric label="Assessments" value={attempts.length} />
            <Metric label="Streak" value={`${stats.activity.current} days`} />
          </div>
        </Panel>
        <Panel>
          <h3>Profile complete</h3>
          <p className="muted mt-2 mb-5 text-sm">
            You’re all set. Keep your details current as you grow.
          </p>
          <Progress value={100} label="Profile completion" />
          <div className="positive mt-4 flex gap-2 text-xs">
            <Check size={14} />
            All essential details added
          </div>
          <Separator className="my-6" />
          <h3>Preferred skill areas</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.split(",").map((skill) => (
              <span className="badge tone-neutral" key={skill}>
                {skill.trim()}
              </span>
            ))}
          </div>
        </Panel>
      </div>
      {editing && (
        <Panel className="section-space">
          <h2>Edit your details</h2>
          <form onSubmit={save} className="mt-6" noValidate>
            <div className="form-grid">
              {(
                [
                  { key: "name", label: "Display name" },
                  { key: "username", label: "Username" },
                  { key: "email", label: "Email address" },
                  { key: "country", label: "Country" },
                  { key: "bio", label: "Short bio" },
                  { key: "skills", label: "Skill areas (comma separated)" },
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
                      aria-describedby={
                        errors[key] ? `error-${key}` : undefined
                      }
                    />
                  ) : (
                    <Input
                      value={draft[key]}
                      type={key === "email" ? "email" : "text"}
                      onChange={(e) =>
                        setDraft({ ...draft, [key]: e.target.value })
                      }
                      aria-invalid={!!errors[key]}
                      aria-describedby={
                        errors[key] ? `error-${key}` : undefined
                      }
                    />
                  )}{" "}
                  {errors[key] && (
                    <span className="field-error" id={`error-${key}`}>
                      {errors[key]}
                    </span>
                  )}
                </Label>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Panel>
      )}
      {message && (
        <p role="status" className="form-message mt-5">
          {message}
        </p>
      )}
    </PageEntrance>
  )
}
