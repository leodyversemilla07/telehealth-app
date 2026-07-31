import { expect, test } from "@playwright/test"
import { expectPageTitle, loginAs } from "./helpers"

test.describe("Doctor Consultation", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "doctor")
  })

  test("renders doctor dashboard", async ({ page }) => {
    await expectPageTitle(page, /doctor dashboard/i)
  })

  test("navigates to consultations list", async ({ page }) => {
    await page.goto("/doctor/consultations")
    await expectPageTitle(page, /consultations queue/i)
  })

  test("can access schedule page", async ({ page }) => {
    await page.goto("/doctor/schedule")
    await expectPageTitle(page, /availability & schedule/i)
  })

  test("can view patients list", async ({ page }) => {
    await page.goto("/doctor/patients")
    await expectPageTitle(page, /^Patients$/)
  })

  test("can access messages", async ({ page }) => {
    await page.goto("/doctor/chat")
    await expectPageTitle(page, /messages/i)
  })
})

test.describe("Patient Portal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "patient")
  })

  test("renders patient dashboard", async ({ page }) => {
    await expectPageTitle(page, /hello,/i)
  })

  test("can view medical records", async ({ page }) => {
    await page.goto("/patient/records")
    await expectPageTitle(page, /medical records/i)
  })

  test("can view prescriptions", async ({ page }) => {
    await page.goto("/patient/prescriptions")
    await expectPageTitle(page, /prescriptions/i)
  })

  test("can access AI symptom checker", async ({ page }) => {
    await page.goto("/patient/symptoms")
    await expectPageTitle(page, /AI Symptom Checker/i)
  })

  test("can access settings", async ({ page }) => {
    await page.goto("/patient/settings")
    await expectPageTitle(page, /^Profile$/)
  })
})

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin")
  })

  test("renders admin dashboard with stats", async ({ page }) => {
    await expectPageTitle(page, /admin dashboard/i)
  })

  test("can view users list", async ({ page }) => {
    await page.goto("/admin/users")
    await expectPageTitle(page, /users management/i)
  })

  test("can view doctors management", async ({ page }) => {
    await page.goto("/admin/doctors")
    await expectPageTitle(page, /doctor verification/i)
  })

  test("can view audit logs", async ({ page }) => {
    await page.goto("/admin/audit-logs")
    await expectPageTitle(page, /audit logs/i)
  })

  test("non-admin gets 403 on admin routes", async ({ page }) => {
    // Login as patient first
    await loginAs(page, "patient")

    // Try to access admin route
    await page.goto("/admin/dashboard")
    await expect(
      page.getByText(/access denied/i).or(page.getByText(/403/i)),
    ).toBeVisible({ timeout: 10_000 })
  })
})
