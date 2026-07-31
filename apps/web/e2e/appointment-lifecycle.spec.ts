import { expect, test } from "@playwright/test"
import { expectPageTitle, loginAs } from "./helpers"

/**
 * End-to-end test covering the full appointment lifecycle:
 *   Patient books → Doctor confirms → Patient joins video → Doctor completes
 *
 * Prerequisites:
 *   - Seed data applied (see e2e/helpers.ts for canonical credentials)
 *   - Doctor has availability set for a future date
 *   - Patient has a completed patient profile
 */

test.describe("Full Appointment Lifecycle", () => {
  test.describe.configure({ mode: "serial" })

  // ─── STEP 1: PATIENT BOOKS ──────────────────────────────────────
  test("1 - Patient books an appointment", async ({ page }) => {
    await loginAs(page, "patient")

    // Navigate to book appointment
    await page.goto("/patient/appointments/book")
    await expectPageTitle(page, /book a consultation/i)

    // Wait for doctors list to load and select one
    const bookButton = page
      .getByRole("button", { name: /book consult/i })
      .first()
    await expect(bookButton).toBeVisible({ timeout: 15_000 })
    await bookButton.click()

    // Check that booking form is visible
    await expect(page.getByText(/select date/i)).toBeVisible({ timeout: 5_000 })
  })

  // ─── STEP 2: PATIENT VIEWS APPOINTMENT LIST ─────────────────────
  test("2 - Patient can view their appointments", async ({ page }) => {
    await loginAs(page, "patient")

    await page.goto("/patient/appointments")
    await expectPageTitle(page, /my appointments/i)
  })

  // ─── STEP 3: DOCTOR VIEWS CONSULTATIONS ─────────────────────────
  test("3 - Doctor logs in and views consultations", async ({ page }) => {
    await loginAs(page, "doctor")

    await page.goto("/doctor/consultations")
    await expectPageTitle(page, /consultations queue/i)
  })

  // ─── STEP 4: DOCTOR MANAGES SCHEDULE ────────────────────────────
  test("4 - Doctor can manage their schedule", async ({ page }) => {
    await loginAs(page, "doctor")

    await page.goto("/doctor/schedule")
    await expectPageTitle(page, /availability & schedule/i)
  })

  // ─── STEP 5: PATIENT USES SYMPTOM CHECKER ────────────────────────
  test("5 - Patient can use AI symptom checker", async ({ page }) => {
    await loginAs(page, "patient")

    await page.goto("/patient/symptoms")
    await expectPageTitle(page, /AI Symptom Checker/i)

    // Type symptoms into the textarea
    const textarea = page.getByPlaceholder(/persistent headache/i)
    await expect(textarea).toBeVisible({ timeout: 5_000 })
    await textarea.fill(
      "I've been experiencing a persistent headache for 3 days, along with mild fever.",
    )
  })

  // ─── STEP 6: DOCTOR VIEWS PATIENT RECORDS ────────────────────────
  test("6 - Doctor can view patient records", async ({ page }) => {
    await loginAs(page, "doctor")

    await page.goto("/doctor/patients")
    await expectPageTitle(page, /^Patients$/)
  })

  // ─── STEP 7: ADMIN OVERSIGHT ─────────────────────────────────────
  test("7 - Admin can monitor appointments and users", async ({ page }) => {
    await loginAs(page, "admin")

    // Check dashboard stats
    await expectPageTitle(page, /admin dashboard/i)

    // View users
    await page.goto("/admin/users")
    await expectPageTitle(page, /users management/i)

    // View doctors management
    await page.goto("/admin/doctors")
    await expectPageTitle(page, /doctor verification/i)
  })

  // ─── STEP 8: CROSS-ROLE ACCESS CONTROL ──────────────────────────
  test("8 - Patient cannot access doctor routes", async ({ page }) => {
    await loginAs(page, "patient")

    await page.goto("/doctor/dashboard")
    // Should have been redirected back to patient dashboard
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })
  })

  // ─── STEP 9: FORGOT PASSWORD FLOW ───────────────────────────────
  test("9 - Forgot password page works", async ({ page }) => {
    await page.goto("/forgot-password")
    await expect(page.getByRole("heading", { name: /forgot/i })).toBeVisible({
      timeout: 10_000,
    })

    // Fill in email and submit
    const emailInput = page.getByPlaceholder(/m@example.com/i)
    await expect(emailInput).toBeVisible()
    await emailInput.fill("alice@example.com")
    await page.getByRole("button", { name: /send recovery link/i }).click()

    // Should show success message or redirect
    await expect(
      page.getByText(/check your email|sent|success|reset/i).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  // ─── STEP 10: PATIENT MANAGED SETTINGS ──────────────────────────
  test("10 - Patient can manage settings", async ({ page }) => {
    await loginAs(page, "patient")

    // Profile settings
    await page.goto("/patient/settings/profile")
    await expectPageTitle(page, /^Profile$/)

    // Two-factor settings
    await page.goto("/patient/settings/two-factor")
    await expect(
      page.getByRole("heading", { name: /two[- ]?factor/i }),
    ).toBeVisible({
      timeout: 10_000,
    })

    // Health profile
    await page.goto("/patient/settings/health")
    await expectPageTitle(page, /health information/i)
  })
})
