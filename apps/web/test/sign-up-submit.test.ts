import { beforeEach, describe, expect, it, vi } from "vitest"
import { type SignUpDeps, submitSignUp } from "@/components/sign-up-submit"

function makeForm(data: Record<string, string>) {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) fd.append(key, value)
  return fd
}

const baseDeps: SignUpDeps = {
  signUpEmail: vi.fn().mockResolvedValue({ error: null }),
  recordConsent: vi.fn().mockResolvedValue({}),
}

describe("submitSignUp (F-AUTH-07: privacy consent required)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("blocks sign-up and does not call auth when consent is not given", async () => {
    const result = await submitSignUp(
      makeForm({
        name: "Jane",
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
    expect(baseDeps.recordConsent).not.toHaveBeenCalled()
  })

  it("signs up and records privacy consent when consent is given", async () => {
    const result = await submitSignUp(
      makeForm({
        name: "Jane",
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
        name: "Jane",
        email: "jane@example.com",
        password: "Password123!",
        role: "PATIENT",
      }),
    )
    expect(baseDeps.recordConsent).toHaveBeenCalledWith({
      consentType: "privacy_policy",
      granted: true,
    })
  })

  it("requires all fields", async () => {
    const result = await submitSignUp(
      makeForm({ name: "", email: "", password: "" }),
      true,
      baseDeps,
    )

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/required/i)
    expect(baseDeps.signUpEmail).not.toHaveBeenCalled()
  })
})
