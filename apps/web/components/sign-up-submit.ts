/**
 * Pure sign-up submission logic, extracted from SignUpForm so it can be
 * unit-tested without rendering the (JSX) component.
 *
 * Implements F-AUTH-07: a privacy-consent gate before account creation.
 * The acceptance marker is sent with the Better Auth signup request, where
 * the server replaces it with an authoritative timestamp and policy version
 * persisted in the same transaction as the user.
 */

export type SignUpState = {
  error: string | null
  success: boolean
  email: string
  role: string
}

export interface SignUpDeps {
  signUpEmail: (input: {
    name: string
    firstName: string
    middleName: string
    lastName: string
    email: string
    password: string
    role: string
    privacyPolicyConsent: true
  }) => Promise<{ error: { message?: string; statusText?: string } | null }>
}

export async function submitSignUp(
  formData: FormData,
  consent: boolean,
  deps: SignUpDeps,
): Promise<SignUpState> {
  const firstName = (formData.get("firstName") as string) ?? ""
  const middleName = (formData.get("middleName") as string) ?? ""
  const lastName = (formData.get("lastName") as string) ?? ""
  const email = (formData.get("email") as string) ?? ""
  const password = (formData.get("password") as string) ?? ""
  const role = (formData.get("role") as string) ?? ""

  if (!consent) {
    return {
      error: "You must accept the Privacy Policy to create an account.",
      success: false,
      email: "",
      role,
    }
  }

  if (!firstName || !lastName || !email || !password) {
    return {
      error: "First name, last name, email, and password are required",
      success: false,
      email: "",
      role,
    }
  }

  // Build the full name from individual parts
  const fullName = [firstName, middleName, lastName].filter(Boolean).join(" ")

  const { error: signUpError } = await deps.signUpEmail({
    name: fullName,
    firstName,
    middleName,
    lastName,
    email,
    password,
    role,
    privacyPolicyConsent: true,
  })

  if (signUpError) {
    return {
      error: signUpError.message ?? signUpError.statusText ?? "Sign up failed",
      success: false,
      email: "",
      role,
    }
  }

  return { error: null, success: true, email, role }
}
