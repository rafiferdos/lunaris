"use client"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useId, useState } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { Sun, Moon, Monitor, Check } from "lucide-react"
import { PageHeader, Panel, Select } from "@/components/shared/ui"
import { Button } from "@/components/ui/button"
import { PageEntrance } from "@/components/shared/motion"
import { useHydrated } from "@/lib/local-store"
import { usePreferences, setPreferences, type Preferences } from "./preferences"
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
  const preferences = usePreferences()
  const { theme, setTheme } = useTheme()
  const hydrated = useHydrated()
  const [message, setMessage] = useState("")
  function update(patch: Partial<Preferences>) {
    try {
      setPreferences({ ...preferences, ...patch })
      setMessage("Preferences saved on this device.")
    } catch {
      setMessage(
        "Could not save preferences. Check your browser storage settings."
      )
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
                  if (values[0]) setTheme(values[0])
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
              description="Email preference only; no emails are sent in this demo."
              checked={preferences.email}
              onChange={(value) => update({ email: value })}
            />
            <SettingToggle
              label="Practice reminders"
              description="Save a reminder preference for the future service."
              checked={preferences.reminders}
              onChange={(value) => update({ reminders: value })}
            />
          </Panel>
          <Panel>
            <h2>Privacy & account</h2>
            <SettingToggle
              label="Public profile"
              description="Local preference; the demo leaderboard remains visible."
              checked={preferences.publicProfile}
              onChange={(value) => update({ publicProfile: value })}
            />
            <p className="muted my-5 text-xs">
              This is a mock account. No credentials or personal data are sent
              to a server.
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Leave demo workspace
            </Button>
          </Panel>
          <Button
            variant="outline"
            onClick={() => {
              try {
                setPreferences({
                  palette: "taupe",
                  radius: "default",
                  density: "comfortable",
                  reducedMotion: false,
                  difficulty: "easy",
                  timer: true,
                  email: true,
                  reminders: false,
                  publicProfile: true,
                  topics: ["javascript", "react"],
                })
                setTheme("system")
                setMessage("Appearance and preferences restored to defaults.")
              } catch {
                setMessage("Could not reset preferences.")
              }
            }}
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
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
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
        id={id}
        aria-describedby={`${id}-description`}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  )
}
