/**
 * Pure sign-up submission logic, extracted from SignUpForm so it can be
 * unit-tested without rendering the (JSX) component.
 *
 * Implements F-AUTH-07: a privacy-consent gate before account creation,
 * followed by a best-effort privacy-consent record via POST /consent.
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
    email: string
    password: string
    role: string
  }) => Promise<{ error: { message?: string; statusText?: string } | null }>
  recordConsent: (data: {
    consentType: string
    granted: boolean
  }) => Promise<unknown>
}

export async function submitSignUp(
  formData: FormData,
  consent: boolean,
  deps: SignUpDeps,
): Promise<SignUpState> {
  const name = (formData.get("name") as string) ?? ""
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

  if (!name || !email || !password) {
    return {
      error: "All fields are required",
      success: false,
      email: "",
      role,
    }
  }

  const { error: signUpError } = await deps.signUpEmail({
    name,
    email,
    password,
    role,
  })

  if (signUpError) {
    return {
      error: signUpError.message ?? signUpError.statusText ?? "Sign up failed",
      success: false,
      email: "",
      role,
    }
  }

  // Record privacy-consent acceptance (best-effort). Better Auth auto signs
  // the user in on sign-up, so the session cookie is available for the
  // authenticated /consent request. Failure here is non-fatal; the user can
  // manage consent later in settings.
  try {
    await deps.recordConsent({
      consentType: "privacy_policy",
      granted: true,
    })
  } catch {
    // Non-fatal: consent can be recorded later in settings.
  }

  return { error: null, success: true, email, role }
}
