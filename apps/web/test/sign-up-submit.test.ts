import { beforeEach, describe, expect, it, vi } from "vitest"
import { type SignUpDeps, submitSignUp } from "@/components/sign-up-submit"

function makeForm(data: Record<string, string>) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) fd.append(key, value)
  return fd
}

const baseDeps: SignUpDeps = {
  signUpEmail: vi.fn().mockResolvedValue({ error: null }),
}

describe("submitSignUp (F-AUTH-07: privacy consent required)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("blocks sign-up and does not call auth when consent is not given", async () => {
    const result = await submitSignUp(
      makeForm({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "Password123!",
        role: "PATIENT",
      }),
      false,
      baseDeps,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/Privacy Policy/i)
    expect(baseDeps.signUpEmail).not.toHaveBeenCalled()
  })

  it("includes privacy consent in the atomic signup request", async () => {
    const result = await submitSignUp(
      makeForm({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "Password123!",
        role: "PATIENT",
      }),
      true,
      baseDeps,
    )

    expect(result.success).toBe(true)
    expect(baseDeps.signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Jane Doe",
        firstName: "Jane",
        middleName: "",
        lastName: "Doe",
        email: "jane@example.com",
        password: "Password123!",
        role: "PATIENT",
        privacyPolicyConsent: true,
      }),
    )
  })

  it("requires all fields", async () => {
    const result = await submitSignUp(
      makeForm({ firstName: "", lastName: "", email: "", password: "" }),
      true,
      baseDeps,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/required/i)
    expect(baseDeps.signUpEmail).not.toHaveBeenCalled()
  })
})
