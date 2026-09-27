"use client"
import { Skeleton } from "@/components/ui/skeleton"
import dynamic from "next/dynamic"
export const LazyTrend = dynamic(
  () => import("./trend-chart").then((module) => module.TrendChart),
  {
    ssr: false,
    loading: () => (
      <Skeleton
        className="skeleton"
        style={{ height: 270 }}
        aria-label="Loading chart"
      />
    ),
  }
)
