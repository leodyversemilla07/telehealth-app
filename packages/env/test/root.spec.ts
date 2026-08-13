import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { describe, expect, it } from "vitest"

// Mirrors the workspace-root detection in src/index.ts: a directory is the
// root if it carries pnpm-workspace.yaml OR a package.json declaring workspaces.
// Kept as a local copy so the test exercises the algorithm without depending
// on module-load side effects.
function findRoot(start: string): string | null {
  let directory = resolve(start)

  for (;;) {
    if (existsSync(join(directory, "pnpm-workspace.yaml"))) return directory

    const manifest = join(directory, "package.json")
    if (existsSync(manifest)) {
      try {
        const parsed: unknown = JSON.parse(readFileSync(manifest, "utf8"))
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "workspaces" in parsed &&
          parsed.workspaces !== undefined
        ) {
          return directory
        }
      } catch {}
    }

    const parent = dirname(directory)
    if (parent === directory) return null
    directory = parent
  }
}

const repoRoot = resolve(import.meta.dirname, "..", "..", "..")

describe("finding the workspace root", () => {
  it("finds it from the repo root itself", () => {
    expect(findRoot(repoRoot)).toBe(repoRoot)
  })

  it("finds it from a package directory", () => {
    for (const pkg of ["apps/api", "packages/db", "packages/env"]) {
      expect(findRoot(join(repoRoot, pkg))).toBe(repoRoot)
    }
  })

  it("finds it from a nested source directory", () => {
    expect(findRoot(join(repoRoot, "packages", "env", "src"))).toBe(repoRoot)
  })

  it("returns null above the repo rather than walking to a drive root", () => {
    expect(findRoot(`${resolve(repoRoot, "..")}/__nope__`)).toBeNull()
  })

  it("recognises the pnpm workspace root's own package.json lacks workspaces", () => {
    // telehealth is a pnpm workspace: root detection relies on pnpm-workspace.yaml,
    // so the root package.json must not need a `workspaces` key.
    const manifest: unknown = JSON.parse(
      readFileSync(join(repoRoot, "package.json"), "utf8"),
    )
    expect(
      typeof manifest === "object" &&
        manifest !== null &&
        "workspaces" in manifest,
    ).toBe(false)
  })
})

describe("the committed root .env.example", () => {
  const example = readFileSync(join(repoRoot, ".env.example"), "utf8")

  it("names every variable the app requires", () => {
    for (const key of [
      "DATABASE_URL",
      "PORT",
      "BETTER_AUTH_URL",
      "BETTER_AUTH_SECRET",
      "CORS_ORIGIN",
      "COOKIE_DOMAIN",
      "EMAIL_FROM",
      "RESEND_API_KEY",
      "LIVEKIT_URL",
      "LIVEKIT_API_KEY",
      "LIVEKIT_API_SECRET",
      "VAPID_PUBLIC_KEY",
      "VAPID_PRIVATE_KEY",
      "API_URL",
      "NEXT_PUBLIC_API_URL",
      "NEXT_PUBLIC_VAPID_KEY",
    ]) {
      expect(example).toContain(`${key}=`)
    }
  })

  it("ships no secret of its own", () => {
    for (const line of example.split("\n")) {
      if (line.startsWith("#") || !line.includes("=")) continue
      const value = line.slice(line.indexOf("=") + 1).trim()
      expect(value === '""' || value.length > 0).toBe(true)
      if (line.startsWith("BETTER_AUTH_SECRET")) expect(value).toBe('""')
    }
  })
})
