import { expect, test } from "@playwright/test"

/**
 * End-to-end tests for the video consultation feature.
 *
 * Prerequisites:
 *   - Seed data with a doctor (doctor@test.com / TestPass123!)
 *   - Seed data with a patient (patient@test.com / TestPass123!)
 *   - An existing CONFIRMED appointment between the doctor and patient
 *   - LiveKit configured (or video endpoints will return 503)
 */

test.describe("Video Consultation", () => {
  test.describe.configure({ mode: "serial" })

  // ─── PATIENT JOINS VIDEO CALL ─────────────────────────────────
  test("patient can view appointment details", async ({ page }) => {
    // Login as patient
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

    // Navigate to appointments
    await page.goto("/patient/appointments")
    await expect(
      page.getByRole("heading", { name: /appointments/i }),
    ).toBeVisible({
      timeout: 10_000,
    })

    // Check that appointments list is visible
    const appointmentsList = page.getByText(/upcoming|past/i)
    await expect(appointmentsList).toBeVisible({ timeout: 5_000 })
  })

  // ─── DOCTOR CAN VIEW CONSULTATIONS ────────────────────────────
  test("doctor can view consultation queue", async ({ page }) => {
    // Login as doctor
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

    // Check that consultation queue is visible
    const queue = page.getByText(/patient consultations/i)
    await expect(queue).toBeVisible({ timeout: 5_000 })
  })

  // ─── DOCTOR CAN VIEW PATIENT RECORDS ──────────────────────────
  test("doctor can access patient records", async ({ page }) => {
    // Login as doctor
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("doctor@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/doctor\/dashboard/, { timeout: 10_000 })

    // Navigate to patients
    await page.goto("/doctor/patients")
    await expect(page.getByRole("heading", { name: /patients/i })).toBeVisible({
      timeout: 10_000,
    })

    // Check that patients list is visible
    const patientsList = page.getByText(/total:/i)
    await expect(patientsList).toBeVisible({ timeout: 5_000 })
  })

  // ─── DOCTOR CAN MANAGE SCHEDULE ───────────────────────────────
  test("doctor can manage schedule", async ({ page }) => {
    // Login as doctor
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("doctor@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/doctor\/dashboard/, { timeout: 10_000 })

    // Navigate to schedule
    await page.goto("/doctor/schedule")
    await expect(page.getByRole("heading", { name: /schedule/i })).toBeVisible({
      timeout: 10_000,
    })

    // Check that schedule manager is visible
    const scheduleManager = page.getByText(/weekly shifts/i)
    await expect(scheduleManager).toBeVisible({ timeout: 5_000 })
  })

  // ─── PATIENT CAN VIEW MEDICAL RECORDS ─────────────────────────
  test("patient can view medical records", async ({ page }) => {
    // Login as patient
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

    // Navigate to records
    await page.goto("/patient/records")
    await expect(page.getByRole("heading", { name: /records/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  // ─── PATIENT CAN VIEW PRESCRIPTIONS ───────────────────────────
  test("patient can view prescriptions", async ({ page }) => {
    // Login as patient
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

    // Navigate to prescriptions
    await page.goto("/patient/prescriptions")
    await expect(
      page.getByRole("heading", { name: /prescriptions/i }),
    ).toBeVisible({ timeout: 10_000 })
  })

  // ─── ADMIN CAN MANAGE USERS ───────────────────────────────────
  test("admin can manage users", async ({ page }) => {
    // Login as admin
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("admin@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 })

    // Navigate to users
    await page.goto("/admin/users")
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  // ─── ADMIN CAN MANAGE DOCTORS ─────────────────────────────────
  test("admin can manage doctors", async ({ page }) => {
    // Login as admin
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("admin@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 })

    // Navigate to doctors
    await page.goto("/admin/doctors")
    await expect(page.getByRole("heading", { name: /doctors/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  // ─── ADMIN CAN VIEW AUDIT LOGS ────────────────────────────────
  test("admin can view audit logs", async ({ page }) => {
    // Login as admin
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("admin@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 })

    // Navigate to audit logs
    await page.goto("/admin/audit-logs")
    await expect(page.getByRole("heading", { name: /audit/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  // ─── ADMIN CAN VIEW REPORTS ───────────────────────────────────
  test("admin can view reports", async ({ page }) => {
    // Login as admin
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("admin@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 })

    // Navigate to reports
    await page.goto("/admin/reports")
    await expect(page.getByRole("heading", { name: /reports/i })).toBeVisible({
      timeout: 10_000,
    })
  })

  // ─── CROSS-ROLE ACCESS CONTROL ─────────────────────────────────
  test("doctor cannot access admin routes", async ({ page }) => {
    // Login as doctor
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("doctor@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/doctor\/dashboard/, { timeout: 10_000 })

    // Try to access admin dashboard
    await page.goto("/admin/dashboard")
    // Should be redirected to doctor dashboard
    await expect(page).toHaveURL(/\/doctor\/dashboard/, { timeout: 10_000 })
  })

  // ─── PATIENT CANNOT ACCESS DOCTOR ROUTES ──────────────────────
  test("patient cannot access doctor routes", async ({ page }) => {
    // Login as patient
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

    // Try to access doctor dashboard
    await page.goto("/doctor/dashboard")
    // Should be redirected to patient dashboard
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })
  })
})
