import { existsSync, readFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const FILES = [".env", ".env.local"] as const

let loaded = false

function findWorkspaceRoot(start: string): string | null {
  let directory = resolve(start)

  for (;;) {
    if (isWorkspaceRoot(directory)) return directory

    const parent = dirname(directory)
    if (parent === directory) return null
    directory = parent
  }
}

function isWorkspaceRoot(directory: string): boolean {
  // pnpm workspaces (this repo) mark the root with pnpm-workspace.yaml.
  if (existsSync(join(directory, "pnpm-workspace.yaml"))) return true

  // bun / npm workspaces declare `workspaces` in package.json instead.
  const manifest = join(directory, "package.json")
  if (!existsSync(manifest)) return false

  try {
    const parsed: unknown = JSON.parse(readFileSync(manifest, "utf8"))
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      "workspaces" in parsed &&
      parsed.workspaces !== undefined
    )
  } catch {
    return false
  }
}

/**
 * Parse a .env-style source into a plain object. Mirrors the shape dotenv
 * produces, so `@telehealth/env` can also be used by scripts that need to
 * inspect files without mutating process.env.
 */
export function parseEnv(source: string): Record<string, string> {
  const values: Record<string, string> = {}

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(
      line,
    )
    if (!match) continue

    const key = match[1]
    let value = (match[2] ?? "").trim()
    if (!key) continue

    const quote = value[0]
    if (
      (quote === '"' || quote === "'") &&
      value.endsWith(quote) &&
      value.length > 1
    ) {
      value = value.slice(1, -1)
      if (quote === '"') {
        value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r")
      }
    } else {
      const comment = value.indexOf(" #")
      if (comment !== -1) value = value.slice(0, comment).trim()
    }

    values[key] = value
  }

  return values
}

/**
 * Load the workspace-root .env (then .env.local, which wins) into
 * process.env. Only unset variables are written, so the real environment and
 * per-process overrides always win. Safe to call many times; idempotent.
 *
 * Consumers that want the env loaded at import time should use the
 * `@telehealth/env/load` entry point (`import "@telehealth/env/load"`) as their
 * FIRST import — this guarantees variables are present before any other module
 * (e.g. Better Auth's graph, which caches NODE_ENV at module scope) reads them.
 */
export function loadRootEnv(): void {
  if (loaded) return
  loaded = true

  const root = findWorkspaceRoot(process.cwd())
  if (!root) return

  const merged: Record<string, string> = {}

  for (const file of FILES) {
    const path = join(root, file)
    if (!existsSync(path)) continue

    try {
      Object.assign(merged, parseEnv(readFileSync(path, "utf8")))
    } catch {}
  }

  for (const [key, value] of Object.entries(merged)) {
    if (process.env[key] === undefined) process.env[key] = value
  }
}
