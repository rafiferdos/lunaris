"use client"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useId, useState } from "react"
import { useTheme } from "next-themes"
import Link from "@/components/shared/app-link"
import { useSignOut } from "@/features/auth/auth-boundary"
import { MutationError } from "@/components/shared/query-state"
import { defaults } from "./schema"
import { Sun, Moon, Monitor, Check } from "lucide-react"
import { PageHeader, Panel, Select } from "@/components/shared/ui"
import { Button } from "@/components/ui/button"
import { PageEntrance } from "@/components/shared/motion"
import { useHydrated } from "@/lib/local-store"
import { useQuery } from "@tanstack/react-query"
import { capabilitiesOptions } from "@/features/auth/session"
import { useSession } from "@/features/auth/auth-boundary"
import {
  usePreferences,
  useUpdatePreferences,
  type Preferences,
} from "./preferences"
const palettes = [
  { name: "taupe", label: "Taupe", swatch: "oklch(.55 .02 43)" },
  { name: "neutral", label: "Neutral", swatch: "oklch(.35 0 0)" },
  { name: "stone", label: "Stone", swatch: "oklch(.55 .01 58)" },
  { name: "zinc", label: "Zinc", swatch: "oklch(.55 .02 286)" },
  { name: "blue", label: "Blue", swatch: "oklch(.55 .22 260)" },
  { name: "green", label: "Green", swatch: "oklch(.55 .15 150)" },
  { name: "rose", label: "Rose", swatch: "oklch(.58 .22 17)" },
] as const
export function SettingsPage() {
  const capabilities = useQuery(capabilitiesOptions)
  const { user } = useSession()
  const preferences = usePreferences()
  const { theme } = useTheme()
  const mutation = useUpdatePreferences()
  const signOut = useSignOut()
  const hydrated = useHydrated()
  const [message, setMessage] = useState("")
  async function update(patch: Partial<Preferences>) {
    try {
      await mutation.mutateAsync(patch)
      setMessage("Preferences saved to your account.")
    } catch {
      setMessage("Could not save preferences. Check your connection and retry.")
    }
  }
  return (
    <PageEntrance>
      <PageHeader
        eyebrow="MAKE YOURSELF AT HOME"
        title="Settings"
        description="A workspace that works the way you do."
      />
      <div className="two-column">
        <div className="stack">
          <Panel>
            <h2>Appearance</h2>
            <p className="muted mt-2 text-sm">
              Quiet by default. Personal by choice.
            </p>
            <div className="setting-row">
              <div>
                <h3>Color mode</h3>
                <p>Follow your device or set a preference.</p>
              </div>
              <ToggleGroup
                aria-label="Color mode"
                value={hydrated && theme ? [theme] : []}
                onValueChange={(values) => {
                  if (["light", "dark", "system"].includes(values[0]))
                    void update({
                      mode: values[0] as "light" | "dark" | "system",
                    })
                }}
              >
                {[
                  { value: "light", icon: Sun },
                  { value: "dark", icon: Moon },
                  { value: "system", icon: Monitor },
                ].map(({ value, icon: Icon }) => (
                  <ToggleGroupItem
                    value={value}
                    key={value}
                    className="flex items-center gap-2 capitalize"
                  >
                    <Icon size={13} />
                    {value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="border-b py-5">
              <h3>Color theme</h3>
              <p className="muted mt-1 mb-5 text-xs">
                Official shadcn palettes. Taupe is your original preset.
              </p>
              <div className="palette-options">
                {palettes.map((palette) => (
                  <Toggle
                    key={palette.name}
                    className="palette-option"
                    aria-label={`${palette.label} color theme`}
                    pressed={preferences.palette === palette.name}
                    onPressedChange={() => update({ palette: palette.name })}
                  >
                    <span
                      className="palette-swatch"
                      style={
                        { "--swatch": palette.swatch } as React.CSSProperties
                      }
                    />
                    {palette.label}
                  </Toggle>
                ))}
              </div>
            </div>
            <div className="setting-row">
              <div>
                <h3>Corner radius</h3>
                <p>Applied throughout your workspace.</p>
              </div>
              <Select
                label="Corner radius"
                value={preferences.radius}
                onChange={(value) =>
                  update({ radius: value as Preferences["radius"] })
                }
                options={["sharp", "compact", "default", "soft", "rounded"]}
              />
            </div>
            <div className="setting-row">
              <div>
                <h3>Density</h3>
                <p>A little more room, or a little more information.</p>
              </div>
              <Select
                label="Interface density"
                value={preferences.density}
                onChange={(value) =>
                  update({ density: value as Preferences["density"] })
                }
                options={["comfortable", "compact"]}
              />
            </div>
            <SettingToggle
              label="Reduce motion"
              description="Shorten transitions and remove movement. Your device preference is also respected."
              checked={preferences.reducedMotion}
              onChange={(value) => update({ reducedMotion: value })}
            />
          </Panel>
          <Panel>
            <h2>Assessment preferences</h2>
            <div className="setting-row">
              <div>
                <h3>Preferred difficulty</h3>
                <p>Your starting suggestion when choosing a level.</p>
              </div>
              <Select
                label="Preferred difficulty"
                value={preferences.difficulty}
                onChange={(value) =>
                  update({ difficulty: value as Preferences["difficulty"] })
                }
                options={["easy", "medium", "competitive"]}
              />
            </div>
            <SettingToggle
              label="Show the timer"
              description="Competitive assessments always display the timer."
              checked={preferences.timer}
              onChange={(value) => update({ timer: value })}
            />
            <div className="pt-5">
              <h3>Preferred topics</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "javascript",
                  "typescript",
                  "react",
                  "nextjs",
                  "communication",
                ].map((topic) => (
                  <Toggle
                    key={topic}
                    disabled={mutation.isPending}
                    variant="outline"
                    className="capitalize"
                    pressed={preferences.topics.includes(topic)}
                    onPressedChange={() =>
                      update({
                        topics: preferences.topics.includes(topic)
                          ? preferences.topics.filter((t) => t !== topic)
                          : [...preferences.topics, topic],
                      })
                    }
                  >
                    {preferences.topics.includes(topic) && <Check size={12} />}{" "}
                    {topic}
                  </Toggle>
                ))}
              </div>
            </div>
          </Panel>
        </div>
        <div className="stack">
          <Panel>
            <h2>A preview of your style</h2>
            <div className="panel mt-6">
              <span className="badge tone-mint">PERSONAL WORKSPACE</span>
              <h3 className="mt-5">Small steps, real progress.</h3>
              <p className="muted mt-2 mb-6 text-sm">
                Your next assessment is a chance to learn something useful.
              </p>
              <Button
                variant="default"
                nativeButton={false}
                render={<Link href="/assessments" />}
              >
                Explore assessments →
              </Button>
            </div>
          </Panel>
          <Panel>
            <h2>Notifications</h2>
            <SettingToggle
              label="Progress summaries"
              description={
                capabilities.data?.notifications
                  ? "Your previous week's completed assessments, once a week by email. Turn off anytime."
                  : "Available once email delivery is configured by your administrator."
              }
              disabled={
                !capabilities.data?.notifications ||
                mutation.isPending ||
                !user.emailVerified
              }
              checked={preferences.email}
              onChange={(value) => update({ email: value })}
            />
            <SettingToggle
              label="Practice reminders"
              description={
                capabilities.data?.notifications
                  ? "A gentle email after three inactive days, at most once a week."
                  : "Available once email delivery is configured by your administrator."
              }
              disabled={
                !capabilities.data?.notifications ||
                mutation.isPending ||
                !user.emailVerified
              }
              checked={preferences.reminders}
              onChange={(value) => update({ reminders: value })}
            />
            {capabilities.data?.notifications && !user.emailVerified && (
              <p className="muted text-sm">
                Verify your email before opting in.{" "}
                <Link href="/verify-email" className="text-link">
                  Request verification
                </Link>
              </p>
            )}
            <MutationError error={capabilities.error} />
          </Panel>
          <Panel>
            <h2>Privacy & account</h2>
            <SettingToggle
              label="Public profile"
              description="Show your eligible results on the public leaderboard."
              checked={preferences.publicProfile}
              onChange={(value) => update({ publicProfile: value })}
            />
            <p className="muted my-5 text-xs">
              Your profile and preferences are saved securely to your account.
            </p>
            <Button
              variant="outline"
              disabled={signOut.isPending}
              onClick={() => signOut.mutate()}
            >
              Sign out
            </Button>
            <MutationError error={signOut.error} />
          </Panel>
          <Button
            variant="outline"
            onClick={() => void update(defaults)}
            disabled={mutation.isPending}
          >
            Reset preferences
          </Button>
        </div>
      </div>
      {message && (
        <p role="status" className="form-message mt-6">
          {message}
        </p>
      )}
    </PageEntrance>
  )
}
function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  const id = useId()
  return (
    <div className="setting-row">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p id={`${id}-description`} className="muted mt-1 max-w-sm text-xs">
          {description}
        </p>
      </div>
      <Switch
        disabled={disabled}
        id={id}
        aria-describedby={`${id}-description`}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  )
}
