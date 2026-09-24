"use client"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
export interface TrendPoint {
  label: string
  value: number
}
export function TrendChart({
  points,
  label = "Rating",
  domain = ["auto", "auto"],
}: {
  points: TrendPoint[]
  label?: string
  domain?: [number | string, number | string]
}) {
  return (
    <div>
      <div
        className="chart-frame"
        role="img"
        aria-label={`${label} trend: ${points.map((p) => `${p.label}: ${p.value}`).join(", ")}`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={1}>
          <AreaChart
            data={points}
            margin={{ left: -15, right: 10, top: 15, bottom: 0 }}
            accessibilityLayer
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--border)"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
              dy={8}
              minTickGap={25}
            />
            <YAxis
              domain={domain}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--foreground)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              name={label}
              stroke="var(--chart-3)"
              fill="var(--chart-1)"
              fillOpacity={0.25}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="muted mt-3 text-xs">
        {label}: {points[0]?.value} → {points.at(-1)?.value} across this period.
      </p>
    </div>
  )
}
