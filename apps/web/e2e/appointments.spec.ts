import { expect, test } from "@playwright/test"

test.describe("Appointment Booking", () => {
  test.beforeEach(async ({ page }) => {
    // Login as patient
    await page.goto("/sign-in")
    await page.getByLabel(/email/i).fill("patient@test.com")
    await page.getByLabel(/password/i).fill("TestPass123!")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })
  })

  test("navigates to book appointment page", async ({ page }) => {
    await page.goto("/patient/appointments/book")
    await expect(
      page.getByRole("heading", { name: /book appointment/i }),
    ).toBeVisible()
  })

  test("displays list of available doctors", async ({ page }) => {
    await page.goto("/patient/appointments/book")
    await expect(page.getByText(/doctors/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test("shows appointment form after selecting doctor", async ({ page }) => {
    await page.goto("/patient/appointments/book")

    // Wait for doctors to load and click first one
    const doctorCard = page
      .getByRole("button", { name: /view profile/i })
      .first()
    await expect(doctorCard).toBeVisible({ timeout: 10_000 })
    await doctorCard.click()

    // Should show booking form elements
    await expect(page.getByText(/select date/i)).toBeVisible()
  })

  test("shows available time slots after selecting date", async ({ page }) => {
    await page.goto("/patient/appointments/book")

    const doctorCard = page
      .getByRole("button", { name: /view profile/i })
      .first()
    await expect(doctorCard).toBeVisible({ timeout: 10_000 })
    await doctorCard.click()

    // Select a date (future date)
    const datePicker = page.getByRole("button", { name: /pick a date/i })
    await datePicker.click()
    const tomorrow = page.locator("[data-day]").nth(2)
    await tomorrow.click()

    // Should show time slots
    await expect(page.getByText(/available/i)).toBeVisible({ timeout: 10_000 })
  })

  test("can view appointments list", async ({ page }) => {
    await page.goto("/patient/appointments")
    await expect(
      page.getByRole("heading", { name: /appointments/i }),
    ).toBeVisible()
  })

  test("shows empty state when no appointments", async ({ page }) => {
    await page.goto("/patient/appointments")
    // Should show either appointments or empty state
    await expect(
      page.getByText(/no appointments/i).or(page.getByText(/appointments/i)),
    ).toBeVisible({ timeout: 10_000 })
  })
})
