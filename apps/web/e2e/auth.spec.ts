import { expect, test } from "@playwright/test"
import { loginAs } from "./helpers"

test.describe("Authentication", () => {
  test.describe("Sign Up", () => {
    test("renders sign-up page", async ({ page }) => {
      await page.goto("/sign-up")
      await expect(
        page.getByRole("heading", { name: /create an account/i }),
      ).toBeVisible()
    })

    test("shows validation errors for empty fields", async ({ page }) => {
      await page.goto("/sign-up")
      await page.getByRole("button", { name: /create account/i }).click()
      // Native `required` validation blocks submission — stay on the page
      await expect(page).toHaveURL(/\/sign-up$/)
      await expect(
        page.getByRole("heading", { name: /create an account/i }),
      ).toBeVisible()
    })

    test("shows password requirements", async ({ page }) => {
      await page.goto("/sign-up")
      await page.getByPlaceholder("First").fill("Jane")
      await page.getByPlaceholder("Last").fill("Doe")
      await page.getByLabel(/email/i).fill(`weak-${Date.now()}@example.com`)
      await page.getByLabel(/password/i).fill("weak")
      await page.getByRole("checkbox", { name: /privacy policy/i }).check()
      await page.getByRole("button", { name: /create account/i }).click()

      await expect(page.getByText(/at least 8 characters/i)).toBeVisible({
        timeout: 10_000,
      })
    })

    test("creates account and shows verification message", async ({ page }) => {
      const email = `test-${Date.now()}@example.com`
      await page.goto("/sign-up")

      await page.getByPlaceholder("First").fill("Test")
      await page.getByPlaceholder("Last").fill("User")
      await page.getByLabel(/email/i).fill(email)
      await page.getByLabel(/password/i).fill("TestPass123!")
      await page.getByRole("checkbox", { name: /privacy policy/i }).check()
      await page.getByRole("button", { name: /create account/i }).click()

      await expect(page.getByText(/check your email/i)).toBeVisible({
        timeout: 10_000,
      })
    })
  })

  test.describe("Sign In", () => {
    test("renders sign-in page", async ({ page }) => {
      await page.goto("/sign-in")
      await expect(
        page.getByRole("heading", { name: /welcome to telehealth/i }),
      ).toBeVisible()
    })

    test("shows error for invalid credentials", async ({ page }) => {
      await page.goto("/sign-in")
      await page.getByLabel(/email/i).fill("nonexistent@example.com")
      await page.getByLabel(/password/i).fill("WrongPass123!")
      await page.getByRole("button", { name: /sign in/i }).click()

      await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 10_000 })
    })

    test("navigates to patient dashboard on successful login", async ({
      page,
    }) => {
      await loginAs(page, "patient")
      await expect(page).toHaveURL(/\/patient\/dashboard/)
    })

    test("navigates to doctor dashboard for doctor role", async ({ page }) => {
      await loginAs(page, "doctor")
      await expect(page).toHaveURL(/\/doctor\/dashboard/)
    })

    test("redirects unauthenticated users to sign-in", async ({ page }) => {
      await page.goto("/patient/dashboard")
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 })
    })
  })

  test.describe("Sign Out", () => {
    test("signs out and redirects to sign-in", async ({ page }) => {
      await loginAs(page, "patient")

      // Open the user menu, then sign out
      await page.getByRole("button", { name: /user menu/i }).click()
      await page.getByRole("menuitem", { name: /log out/i }).click()
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 })
    })
  })
})
