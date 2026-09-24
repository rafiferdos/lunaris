import type { Metadata } from "next"
import { Geist_Mono, Outfit, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import "./palettes.css"
import { ThemeProvider } from "@/components/theme-provider"
const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })
const heading = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-heading",
})
export const metadata: Metadata = {
  title: {
    default: "Lunaris — Progress, with purpose",
    template: "%s | Lunaris",
  },
  description:
    "Thoughtful assessments, meaningful skill insights, and a clearer picture of your progress.",
  robots: { index: false, follow: false },
}
const preferenceScript = `try{const p=JSON.parse(localStorage.getItem('lunaris:preferences')||'{}');const r=document.documentElement;const names=['taupe','neutral','stone','zinc','blue','green','rose'];if(names.includes(p.palette))r.dataset.palette=p.palette;const radii={sharp:'0rem',compact:'0.3rem',default:'0.625rem',soft:'0.85rem',rounded:'1.1rem'};if(radii[p.radius])r.style.setProperty('--radius',radii[p.radius]);if(['comfortable','compact'].includes(p.density))r.dataset.density=p.density;r.dataset.reducedMotion=String(p.reducedMotion===true)}catch{}`
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${mono.variable} ${heading.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
