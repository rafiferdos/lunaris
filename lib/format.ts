export const percent = (value: number | null | undefined) =>
  value == null ? "—" : `${Math.round(value * 10) / 10}%`
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value)) + " UTC"
export const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}`
