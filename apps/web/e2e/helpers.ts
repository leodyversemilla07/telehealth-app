import { createHmac } from "node:crypto"
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

// Mirrors packages/db/prisma/seed.ts — the seeded DOCTOR/ADMIN 2FA secret.
export const E2E_TWO_FACTOR_SECRET = "JBSWY3DPEHPK3PXP"

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/=+$/u, "").toUpperCase()
  let bits = 0
  let value = 0
  const bytes: number[] = []
  for (const char of cleaned) {
    const idx = BASE32.indexOf(char)
    if (idx === -1) throw new Error(`Invalid base32 character: ${char}`)
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

/** RFC 6238 TOTP (SHA-1, 30s step, 6 digits) for a base32 secret. */
export function totp(secret: string): string {
  const key = base32Decode(secret)
  const epochSeconds = Math.floor(Date.now() / 1000)
  // Compute ahead of a window boundary so the server-side verification
  // (1-2s later) doesn't trip on a stale code.
  const counter =
    Math.floor(epochSeconds / 30) + (epochSeconds % 30 >= 27 ? 1 : 0)
  const msg = Buffer.alloc(8)
  msg.writeBigUInt64BE(BigInt(counter))
  const digest = createHmac("sha1", key).update(msg).digest()
  const offset = digest[digest.length - 1]! & 0x0f
  const bin =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff)
  return String(bin % 1_000_000).padStart(6, "0")
}

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

  if (role === "doctor" || role === "admin") {
    // 2FA is enforced for doctors/admins — complete the TOTP challenge
    // using the seed's known secret (packages/db/prisma/seed.ts).
    const codeInput = page.getByLabel("Security Verification Code")
    await expect(codeInput).toBeVisible({ timeout: 15_000 })
    await codeInput.fill(totp(E2E_TWO_FACTOR_SECRET))
    await page.getByRole("button", { name: /verify code/i }).click()
  }

  await expect(page).toHaveURL(redirect, { timeout: 15_000 })
}

/**
 * Assert the page title inside <main>. Page headers are CardTitle divs
 * (no heading role), so match text scoped to the main content area.
 */
export async function expectPageTitle(page: Page, name: RegExp): Promise<void> {
  await expect(page.getByRole("main").getByText(name).first()).toBeVisible()
}
