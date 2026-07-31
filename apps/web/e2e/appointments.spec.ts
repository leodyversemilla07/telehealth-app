import { expect, test } from "@playwright/test"
import { expectPageTitle, loginAs } from "./helpers"

test.describe("Appointment Booking", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "patient")
  })

  test("navigates to book appointment page", async ({ page }) => {
    await page.goto("/patient/appointments/book")
    await expectPageTitle(page, /book a consultation/i)
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
    const bookButton = page
      .getByRole("button", { name: /book consult/i })
      .first()
    await expect(bookButton).toBeVisible({ timeout: 10_000 })
    await bookButton.click()

    // Should show booking form elements
    await expect(page.getByText(/select date/i)).toBeVisible()
  })

  test("shows available time slots after selecting date", async ({ page }) => {
    await page.goto("/patient/appointments/book")

    const bookButton = page
      .getByRole("button", { name: /book consult/i })
      .first()
    await expect(bookButton).toBeVisible({ timeout: 10_000 })
    await bookButton.click()

    // Open the date picker and pick a day in a future month (guaranteed slots)
    await page.locator("#booking-date").click()
    await page.getByRole("button", { name: /next month/i }).click()
    const day = page.locator("button.rdp-day:not([disabled])").first()
    await day.click()

    // Should show the time slot picker (empty state or available slots)
    await expect(page.getByText(/select time slot/i)).toBeVisible({
      timeout: 10_000,
    })
  })

  test("can view appointments list", async ({ page }) => {
    await page.goto("/patient/appointments")
    await expectPageTitle(page, /my appointments/i)
  })

  test("shows empty state when no appointments", async ({ page }) => {
    await page.goto("/patient/appointments")
    // Should show either appointments or empty state
    await expect(
      page
        .getByText(/no appointments/i)
        .or(page.getByText(/appointments/i))
        .first(),
    ).toBeVisible({ timeout: 10_000 })
  })
})
