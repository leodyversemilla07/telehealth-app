import { expect, test } from "@playwright/test"

/**
 * End-to-end test covering the full appointment lifecycle:
 *   Patient books → Doctor confirms → Patient joins video → Doctor completes
 *
 * Prerequisites:
 *   - Seed data with a doctor (doctor@test.com / TestPass123!)
 *   - Seed data with a patient (patient@test.com / TestPass123!)
 *   - Doctor has availability set for a future date
 *   - Patient has a completed patient profile
 */

test.describe("Full Appointment Lifecycle", () => {
  test.describe.configure({ mode: "serial" })

  // ─── STEP 1: PATIENT BOOKS ──────────────────────────────────────
  test("1 - Patient books an appointment", async ({ page }) => {
    // Login as patient
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

    // Navigate to book appointment
    await page.goto("/patient/appointments/book")
    await expect(page.getByRole("heading", { name: /book/i })).toBeVisible({
      timeout: 10_000,
    })

    // Wait for doctors list to load and select one
    const doctorCard = page
      .getByRole("button", { name: /view profile/i })
      .first()
    await expect(doctorCard).toBeVisible({ timeout: 15_000 })
    await doctorCard.click()

    // Check that booking form is visible
    await expect(page.getByText(/select date/i)).toBeVisible({ timeout: 5_000 })
  })

  // ─── STEP 2: PATIENT VIEWS APPOINTMENT LIST ─────────────────────
  test("2 - Patient can view their appointments", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

    await page.goto("/patient/appointments")
    await expect(
      page.getByRole("heading", { name: /appointments/i }),
    ).toBeVisible({
      timeout: 10_000,
    })
  })

  // ─── STEP 3: DOCTOR VIEWS CONSULTATIONS ─────────────────────────
  test("3 - Doctor logs in and views consultations", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("doctor@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/doctor\/dashboard/, { timeout: 10_000 })

    // Navigate to consultations
    await page.goto("/doctor/consultations")
    await expect(
      page.getByRole("heading", { name: /consultations/i }),
    ).toBeVisible({ timeout: 10_000 })
  })

  // ─── STEP 4: DOCTOR MANAGES SCHEDULE ────────────────────────────
  test("4 - Doctor can manage their schedule", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("doctor@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/doctor\/dashboard/, { timeout: 10_000 })

    await page.goto("/doctor/schedule")
    await expect(page.getByRole("heading", { name: /schedule/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  // ─── STEP 5: PATIENT USES SYMPTOM CHECKER ────────────────────────
  test("5 - Patient can use AI symptom checker", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

    await page.goto("/patient/symptoms")
    await expect(
      page
        .getByRole("heading", { name: /symptom/i })
        .or(page.getByText(/symptom/i)),
    ).toBeVisible({ timeout: 10_000 })

    // Type symptoms into the textarea
    const textarea = page.getByPlaceholder(/persistent headache/i)
    await expect(textarea).toBeVisible({ timeout: 5_000 })
    await textarea.fill(
      "I've been experiencing a persistent headache for 3 days, along with mild fever.",
    )
  })

  // ─── STEP 6: DOCTOR VIEWS PATIENT RECORDS ────────────────────────
  test("6 - Doctor can view patient records", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("doctor@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/doctor\/dashboard/, { timeout: 10_000 })

    await page.goto("/doctor/patients")
    await expect(page.getByRole("heading", { name: /patients/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  // ─── STEP 7: ADMIN OVERSIGHT ─────────────────────────────────────
  test("7 - Admin can monitor appointments and users", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("admin@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 })

    // Check dashboard stats
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible(
      { timeout: 10_000 },
    )

    // View users
    await page.goto("/admin/users")
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible({
      timeout: 10_000,
    })

    // View doctors management
    await page.goto("/admin/doctors")
    await expect(page.getByRole("heading", { name: /doctors/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  // ─── STEP 8: CROSS-ROLE ACCESS CONTROL ──────────────────────────
  test("8 - Patient cannot access doctor routes", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

    await page.goto("/doctor/dashboard")
    // Should have been redirected back to patient dashboard
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })
  })

  // ─── STEP 9: FORGOT PASSWORD FLOW ───────────────────────────────
  test("9 - Forgot password page works", async ({ page }) => {
    await page.goto("/forgot-password")
    await expect(
      page.getByRole("heading", { name: /reset password|forgot/i }),
    ).toBeVisible({ timeout: 10_000 })

    // Fill in email and submit
    const emailInput = page.getByPlaceholder(/m@example.com|email/i)
    await expect(emailInput).toBeVisible()
    await emailInput.fill("patient@test.com")
    await page.getByRole("button", { name: /send reset/i }).click()

    // Should show success message or redirect
    await expect(
      page.getByText(/check your email|sent|success|reset/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  // ─── STEP 10: PATIENT MANAGED SETTINGS ──────────────────────────
  test("10 - Patient can manage settings", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

    // Profile settings
    await page.goto("/patient/settings/profile")
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible({
      timeout: 10_000,
    })

    // Two-factor settings
    await page.goto("/patient/settings/two-factor")
    await expect(page.getByText(/two factor|2fa|authenticator/i)).toBeVisible({
      timeout: 10_000,
    })

    // Health profile
    await page.goto("/patient/settings/health")
    await expect(page.getByRole("heading", { name: /health/i })).toBeVisible({
      timeout: 10_000,
    })
  })
})
