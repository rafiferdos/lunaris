import { AppShell } from "@/components/layout/app-shell"
import { AuthBoundary } from "@/features/auth/auth-boundary"
import { WorkspaceProvider } from "@/features/workspace/workspace-provider"
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthBoundary>
      <WorkspaceProvider>
        <AppShell>{children}</AppShell>
      </WorkspaceProvider>
    </AuthBoundary>
  )
}
