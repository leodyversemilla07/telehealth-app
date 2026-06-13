import { expect, test } from "@playwright/test"

test.describe("Doctor Consultation", () => {
  test.beforeEach(async ({ page }) => {
    // Login as doctor
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("doctor@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/doctor\/dashboard/, { timeout: 10_000 })
  })

  test("renders doctor dashboard", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible()
  })

  test("navigates to consultations list", async ({ page }) => {
    await page.goto("/doctor/consultations")
    await expect(
      page.getByRole("heading", { name: /consultations/i }),
    ).toBeVisible()
  })

  test("can access schedule page", async ({ page }) => {
    await page.goto("/doctor/schedule")
    await expect(page.getByRole("heading", { name: /schedule/i })).toBeVisible()
  })

  test("can view patients list", async ({ page }) => {
    await page.goto("/doctor/patients")
    await expect(page.getByRole("heading", { name: /patients/i })).toBeVisible()
  })

  test("can access messages", async ({ page }) => {
    await page.goto("/doctor/chat")
    await expect(
      page
        .getByRole("heading", { name: /messages/i })
        .or(page.getByText(/chat/i)),
    ).toBeVisible()
  })
})

test.describe("Patient Portal", () => {
  test.beforeEach(async ({ page }) => {
    // Login as patient
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })
  })

  test("renders patient dashboard", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible()
  })

  test("can view medical records", async ({ page }) => {
    await page.goto("/patient/records")
    await expect(page.getByRole("heading", { name: /records/i })).toBeVisible()
  })

  test("can view prescriptions", async ({ page }) => {
    await page.goto("/patient/prescriptions")
    await expect(
      page.getByRole("heading", { name: /prescriptions/i }),
    ).toBeVisible()
  })

  test("can access AI symptom checker", async ({ page }) => {
    await page.goto("/patient/symptoms")
    await expect(
      page
        .getByRole("heading", { name: /symptom/i })
        .or(page.getByText(/symptom/i)),
    ).toBeVisible()
  })

  test("can access settings", async ({ page }) => {
    await page.goto("/patient/settings")
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible()
  })
})

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("admin@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 })
  })

  test("renders admin dashboard with stats", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /dashboard/i }),
    ).toBeVisible()
  })

  test("can view users list", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page.getByRole("heading", { name: /users/i })).toBeVisible()
  })

  test("can view doctors management", async ({ page }) => {
    await page.goto("/admin/doctors")
    await expect(page.getByRole("heading", { name: /doctors/i })).toBeVisible()
  })

  test("can view audit logs", async ({ page }) => {
    await page.goto("/admin/audit-logs")
    await expect(page.getByRole("heading", { name: /audit/i })).toBeVisible()
  })

  test("non-admin gets 403 on admin routes", async ({ page }) => {
    // Login as patient first
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

    // Try to access admin route
    await page.goto("/admin/dashboard")
    await expect(
      page.getByText(/access denied/i).or(page.getByText(/403/i)),
    ).toBeVisible({ timeout: 10_000 })
  })
})
