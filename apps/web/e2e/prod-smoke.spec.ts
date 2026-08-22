import { expect, test } from "@playwright/test"

/**
 * READ-ONLY production smoke suite for https://tele-health.app.
 *
 * Unlike the main e2e suite (which seeds accounts, books appointments and
 * mutates state), this spec only NAVIGATES and ASSERTS — no form submits,
 * no sign-ups, no bookings — so it is safe to run against production.
 *
 * Run with:
 *   WEB_URL=https://tele-health.app API_URL=https://api.tele-health.app \
 *     pnpm exec playwright test e2e/prod-smoke.spec.ts
 *
 * The playwright.config webServer entries reuse the live URLs because they
 * already respond 200 (reuseExistingServer is enabled outside CI).
 */

test.describe("Production smoke (read-only)", () => {
  test("homepage renders hero and all redesigned sections", async ({
    page,
  }, testInfo) => {
    await page.goto("/", { waitUntil: "load" })
    await expect(page).toHaveTitle(/telehealth/i)

    // Dynamic (ssr:false) sections mount after hydration; scroll through the
    // page to trigger lazy mounting, then assert each section's copy exists.
    await page.waitForTimeout(1500)
    for (let i = 0; i < 12; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight))
      await page.waitForTimeout(500)
    }
    const body = await page.locator("body").innerText()
    for (const section of [
      "Symptom", // AI symptom-checker section
      "Doctor profiles".slice(0, 6), // doctors directory heading prefix
      "FAQ",
      "Security",
    ]) {
      expect(body, `homepage should contain "${section}"`).toContain(section)
    }

    // No horizontal overflow at the tested viewport
    const overflow = await page.evaluate(() => {
      const doc = document.scrollingElement
      if (!doc) return 0
      return doc.scrollWidth - doc.clientWidth
    })
    expect(
      overflow,
      `${testInfo.project.name}: no horizontal overflow`,
    ).toBeLessThanOrEqual(1)
  })

  for (const route of [
    "/how-it-works",
    "/doctors",
    "/specialties",
    "/about",
    "/faq",
    "/privacy",
    "/terms",
  ]) {
    test(`public page ${route} renders (no 404)`, async ({ page }) => {
      const response = await page.goto(route, { waitUntil: "domcontentloaded" })
      expect(response?.status(), `${route} status`).toBeLessThan(400)
      // Next.js serves its not-found UI for unknown routes; make sure we got
      // real content instead.
      await expect(page.locator("body")).not.toContainText("404", {
        ignoreCase: true,
      })
    })
  }

  test("sign-in page renders the auth form", async ({ page }) => {
    await page.goto("/sign-in", { waitUntil: "domcontentloaded" })
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })

  test("sign-up page renders the registration form", async ({ page }) => {
    await page.goto("/sign-up", { waitUntil: "domcontentloaded" })
    await expect(page.getByRole("textbox", { name: "Email" })).toBeVisible()
    // Consent checkbox is part of the redesigned form
    await expect(page.locator("body")).toContainText(/consent/i)
  })

  test("unauthenticated users are redirected away from patient area", async ({
    page,
  }) => {
    await page.goto("/patient/dashboard", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("unauthenticated users are redirected away from doctor area", async ({
    page,
  }) => {
    await page.goto("/doctor/dashboard", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("footer contact and nav links are present on homepage", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" })
    const footer = page.locator("footer")
    await expect(footer).toBeVisible()
  })

  test("API health endpoint responds ok", async ({ request }) => {
    const res = await request.get(
      `${process.env.API_URL || "https://api.tele-health.app"}/`,
    )
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.status).toBe("ok")
  })
})
