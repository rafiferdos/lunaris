import { Suspense } from "react"
import { ResetPasswordForm } from "@/features/auth/reset-password-form"
import { QueryState } from "@/components/shared/query-state"
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<QueryState label="Opening recovery" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
