"use client"
import Link from "next/link"
import type { ComponentProps } from "react"
import { useGuardedNavigation } from "./navigation-guard"
export default function AppLink(props: ComponentProps<typeof Link>) {
  const navigate = useGuardedNavigation()
  return (
    <Link
      {...props}
      onNavigate={(event) => {
        let prevented = false
        props.onNavigate?.({
          preventDefault: () => {
            prevented = true
            event.preventDefault()
          },
        })
        if (
          !prevented &&
          typeof props.href === "string" &&
          navigate?.(props.href, props.replace)
        )
          event.preventDefault()
      }}
    />
  )
}
