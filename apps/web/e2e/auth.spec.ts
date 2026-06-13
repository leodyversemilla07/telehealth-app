import { expect, test } from "@playwright/test"

test.describe("Authentication", () => {
  test.describe("Sign Up", () => {
    test("renders sign-up page", async ({ page }) => {
      await page.goto("/sign-up")
      await expect(
        page.getByRole("heading", { name: /create account/i }),
      ).toBeVisible()
    })

    test("shows validation errors for empty fields", async ({ page }) => {
      await page.goto("/sign-up")
      await page.getByRole("button", { name: /create account/i }).click()
      await expect(page.getByText(/required/i).first()).toBeVisible()
    })

    test("shows password requirements", async ({ page }) => {
      await page.goto("/sign-up")
      const passwordInput = page.getByLabel(/password/i)
      await passwordInput.fill("weak")
      await expect(page.getByText(/at least 8 characters/i)).toBeVisible()
    })

    test("creates account and shows verification message", async ({ page }) => {
      const email = `test-${Date.now()}@example.com`
      await page.goto("/sign-up")

      await page.getByLabel(/full name/i).fill("Test User")
      await page.getByLabel(/email/i).fill(email)
      await page.getByLabel(/password/i).fill("TestPass123!")
      await page.getByRole("button", { name: /create account/i }).click()

      await expect(page.getByText(/verification/i)).toBeVisible({
        timeout: 10_000,
      })
    })
  })

  test.describe("Sign In", () => {
    test("renders sign-in page", async ({ page }) => {
      await page.goto("/sign-in")
      await expect(
        page.getByRole("heading", { name: /sign in/i }),
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
      await page.goto("/sign-in")
      await page.getByLabel(/email/i).fill("patient@test.com")
      await page.getByLabel(/password/i).fill("TestPass123!")
      await page.getByRole("button", { name: /sign in/i }).click()

      await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })
    })

    test("navigates to doctor dashboard for doctor role", async ({ page }) => {
      await page.goto("/sign-in")
      await page.getByLabel(/email/i).fill("doctor@test.com")
      await page.getByLabel(/password/i).fill("TestPass123!")
      await page.getByRole("button", { name: /sign in/i }).click()

      await expect(page).toHaveURL(/\/doctor\/dashboard/, { timeout: 10_000 })
    })

    test("redirects unauthenticated users to sign-in", async ({ page }) => {
      await page.goto("/patient/dashboard")
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 })
    })
  })

  test.describe("Sign Out", () => {
    test("signs out and redirects to sign-in", async ({ page }) => {
      // Login first
      await page.goto("/sign-in")
      await page.getByLabel(/email/i).fill("patient@test.com")
      await page.getByLabel(/password/i).fill("TestPass123!")
      await page.getByRole("button", { name: /sign in/i }).click()
      await expect(page).toHaveURL(/\/patient\/dashboard/, { timeout: 10_000 })

      // Sign out
      await page.getByRole("button", { name: /log out/i }).click()
      await expect(page).toHaveURL(/\/sign-in/, { timeout: 10_000 })
    })
  })
})
