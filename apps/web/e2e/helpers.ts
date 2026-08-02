import { expect, type Page } from "@playwright/test"

/**
 * Shared E2E helpers.
 *
 * Credentials mirror the canonical seed (apps/api/prisma/seed.ts):
 *   admin@example.com / Admin123!
 *   doctor@example.com / Doctor123!
 *   alice@example.com  / Patient123!  (patient)
 *   bob@example.com    / Patient123!  (patient)
 */

export const CREDENTIALS = {
  patient: { email: "alice@example.com", password: "Patient123!" },
  doctor: { email: "doctor@example.com", password: "Doctor123!" },
  admin: { email: "admin@example.com", password: "Admin123!" },
} as const

export type Role = keyof typeof CREDENTIALS

/** Sign in with a seeded account and wait for the role-specific redirect. */
export async function loginAs(page: Page, role: Role): Promise<void> {
  const redirect = {
    patient: /\/patient\/dashboard/,
    doctor: /\/doctor\/dashboard/,
    admin: /\/admin\/dashboard/,
  }[role]

  await page.goto("/sign-in")
  await page.getByLabel(/email/i).fill(CREDENTIALS[role].email)
  await page
    .getByLabel("Password", { exact: true })
    .fill(CREDENTIALS[role].password)
  await page.getByRole("button", { name: /sign in/i }).click()
  await expect(page).toHaveURL(redirect, { timeout: 15_000 })
}

/**
 * Assert the page title inside <main>. Page headers are CardTitle divs
 * (no heading role), so match text scoped to the main content area.
 */
export async function expectPageTitle(page: Page, name: RegExp): Promise<void> {
  await expect(page.getByRole("main").getByText(name).first()).toBeVisible()
}
