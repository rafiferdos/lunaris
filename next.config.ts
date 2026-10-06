import type { NextConfig } from "next"

const upstream = process.env.API_UPSTREAM
if (upstream) {
  const origin = new URL(upstream)
  if (
    !["http:", "https:"].includes(origin.protocol) ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password
  )
    throw new Error("API_UPSTREAM must be an HTTP(S) origin.")
}
if (process.env.NEXT_PUBLIC_API_URL === "same-origin" && !upstream)
  throw new Error("Same-origin API mode requires API_UPSTREAM.")
const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async rewrites() {
    return upstream
      ? [
          {
            source: "/api/:path*",
            destination: `${new URL(upstream).origin}/api/:path*`,
          },
        ]
      : []
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=(self)",
          },
        ],
      },
    ]
  },
}

export default nextConfig
