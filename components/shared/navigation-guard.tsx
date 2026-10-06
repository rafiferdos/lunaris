"use client"
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { MutationError } from "./query-state"
type Guard = { prepare: () => Promise<void>; confirm: boolean }
const Context = createContext<{
  register: (guard: Guard) => () => void
  navigate: (href: string, replace?: boolean) => boolean
  busy: boolean
} | null>(null)
export function NavigationGuardProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const guard = useRef<Guard | null>(null),
    router = useRouter()
  const [destination, setDestination] = useState<{
    href: string
    replace?: boolean
    guard: Guard
  } | null>(null)
  const [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null)
  const active = useRef(false)
  const register = useCallback((value: Guard) => {
    guard.current = value
    return () => {
      if (guard.current === value) guard.current = null
    }
  }, [])
  async function proceed(next: NonNullable<typeof destination>) {
    if (active.current) return
    active.current = true
    setBusy(true)
    setError(null)
    try {
      await next.guard.prepare()
      setDestination(null)
      if (next.replace) router.replace(next.href)
      else router.push(next.href)
    } catch (error) {
      setError(error)
      setDestination(next)
    } finally {
      active.current = false
      setBusy(false)
    }
  }
  return (
    <Context
      value={{
        register,
        busy,
        navigate: (href, replace) => {
          if (!guard.current) return false
          const next = { href, replace, guard: guard.current }
          setError(null)
          if (next.guard.confirm) setDestination(next)
          else void proceed(next)
          return true
        },
      }}
    >
      {children}
      <AlertDialog
        open={destination !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setDestination(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {destination?.guard.confirm
                ? "Leave this assessment?"
                : "Save before leaving"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {destination?.guard.confirm
                ? "Your current answer will be committed and this Competitive attempt submitted. Remaining questions receive skipped scoring. You cannot resume it afterward."
                : "Your latest answer could not be saved. Retry to save it before leaving this page."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <MutationError error={error} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Stay here</AlertDialogCancel>
            <Button
              disabled={busy}
              onClick={() => {
                if (destination) void proceed(destination)
              }}
            >
              {busy
                ? "Saving…"
                : destination?.guard.confirm
                  ? "Submit and leave"
                  : "Retry save"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Context>
  )
}
export function useNavigationSave(
  prepare: () => Promise<void>,
  confirm = false
) {
  const context = useContext(Context)
  const register = context?.register
  useEffect(
    () => register?.({ prepare, confirm }),
    [register, confirm, prepare]
  )
}
export function useGuardedNavigation() {
  return useContext(Context)?.navigate
}
export function useNavigationPending() {
  return useContext(Context)?.busy ?? false
}
