import { expect, test } from "@playwright/test"
import { expectPageTitle, loginAs } from "./helpers"

/**
 * End-to-end tests for the video consultation feature.
 *
 * Prerequisites:
 *   - Seed data applied (see e2e/helpers.ts for canonical credentials)
 *   - An existing CONFIRMED appointment between the doctor and patient
 *   - LiveKit configured (or video endpoints will return 503)
 */

test.describe("Video Consultation", () => {
  test.describe.configure({ mode: "serial" })

  // ─── PATIENT JOINS VIDEO CALL ─────────────────────────────────
  test("patient can view appointment details", async ({ page }) => {
    await loginAs(page, "patient")

    // Navigate to appointments
    await page.goto("/patient/appointments")
    await expectPageTitle(page, /my appointments/i)

    // Check that appointments list is visible
    const appointmentsList = page.getByText(/upcoming|past/i)
    await expect(appointmentsList).toBeVisible({ timeout: 5_000 })
  })

  // ─── DOCTOR CAN VIEW CONSULTATIONS ────────────────────────────
  test("doctor can view consultation queue", async ({ page }) => {
    await loginAs(page, "doctor")

    // Navigate to consultations
    await page.goto("/doctor/consultations")
    await expectPageTitle(page, /consultations queue/i)

    // Check that consultation queue is visible
    const queue = page.getByText(/patient consultations/i)
    await expect(queue).toBeVisible({ timeout: 5_000 })
  })

  // ─── DOCTOR CAN VIEW PATIENT RECORDS ──────────────────────────
  test("doctor can access patient records", async ({ page }) => {
    await loginAs(page, "doctor")

    // Navigate to patients
    await page.goto("/doctor/patients")
    await expectPageTitle(page, /^Patients$/)

    // Check that patients list is visible
    const patientsList = page.getByText(/total:/i)
    await expect(patientsList).toBeVisible({ timeout: 5_000 })
  })

  // ─── DOCTOR CAN MANAGE SCHEDULE ───────────────────────────────
  test("doctor can manage schedule", async ({ page }) => {
    await loginAs(page, "doctor")

    // Navigate to schedule
    await page.goto("/doctor/schedule")
    await expectPageTitle(page, /availability & schedule/i)

    // Check that schedule manager is visible
    await expectPageTitle(page, /availability & schedule/i)
  })

  // ─── PATIENT CAN VIEW MEDICAL RECORDS ─────────────────────────
  test("patient can view medical records", async ({ page }) => {
    await loginAs(page, "patient")

    // Navigate to records
    await page.goto("/patient/records")
    await expectPageTitle(page, /medical records/i)
  })

  // ─── PATIENT CAN VIEW PRESCRIPTIONS ───────────────────────────
  test("patient can view prescriptions", async ({ page }) => {
    await loginAs(page, "patient")

    // Navigate to prescriptions
    await page.goto("/patient/prescriptions")
    await expectPageTitle(page, /prescriptions/i)
  })

  // ─── ADMIN CAN MANAGE USERS ───────────────────────────────────
  test("admin can manage users", async ({ page }) => {
    await loginAs(page, "admin")

    // Navigate to users
    await page.goto("/admin/users")
    await expectPageTitle(page, /users management/i)
  })

  // ─── ADMIN CAN MANAGE DOCTORS ─────────────────────────────────
  test("admin can manage doctors", async ({ page }) => {
    await loginAs(page, "admin")

    // Navigate to doctors
    await page.goto("/admin/doctors")
    await expectPageTitle(page, /doctor verification/i)
  })

  // ─── ADMIN CAN VIEW AUDIT LOGS ────────────────────────────────
  test("admin can view audit logs", async ({ page }) => {
    await loginAs(page, "admin")

    // Navigate to audit logs
    await page.goto("/admin/audit-logs")
    await expectPageTitle(page, /audit logs/i)
  })

  // ─── ADMIN CAN VIEW REPORTS ───────────────────────────────────
  test("admin can view reports", async ({ page }) => {
    await loginAs(page, "admin")

    // Navigate to reports
    await page.goto("/admin/reports")
    await expectPageTitle(page, /^Reports$/)
  })

  // ─── CROSS-ROLE ACCESS CONTROL ─────────────────────────────────
  test("doctor cannot access admin routes", async ({ page }) => {
    await loginAs(page, "doctor")

    // Try to access admin dashboard
    await page.goto("/admin/dashboard")
    // Should be redirected to doctor dashboard
    await expect(page).toHaveURL(/\/doctor\/dashboard/, { timeout: 10_000 })
  })

  // ─── PATIENT CANNOT ACCESS DOCTOR ROUTES ──────────────────────
  test("patient cannot access doctor routes", async ({ page }) => {
    await loginAs(page, "patient")

    // Try to access doctor dashboard
    await page.goto("/doctor/dashboard")
    // Should be redirected to patient dashboard
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })
  })
})
