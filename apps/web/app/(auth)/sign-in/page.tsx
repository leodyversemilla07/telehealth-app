import { AuthLayout } from "@/components/auth-layout"
import { SignInForm } from "@/components/sign-in-form"

export default function SignInPage() {
  return (
    <AuthLayout variant="sign-in">
      <SignInForm />
    </AuthLayout>
  )
}
