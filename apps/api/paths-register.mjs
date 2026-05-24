/**
 * ESM-compatible path alias registration.
 *
 * In development (ts-node / nest start --watch), TypeScript resolves
 * `@/` and `@generated/` via tsconfig.json `paths` automatically.
 *
 * This file is used only when running the compiled JS output WITHOUT
 * `tsc-alias` (e.g., quick dev iteration with `node`). It registers
 * the same path mappings at runtime so `@/` → `dist/src/` and
 * `@generated/` → `dist/generated/` resolve correctly.
 *
 * For production builds, `tsc-alias` bakes relative paths into the JS
 * output — no runtime registration needed.
 */

import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)

// tsconfig-paths exposes a CJS API; use createRequire to bridge into ESM
const tsConfigPaths = require("tsconfig-paths")

const baseUrl = resolve(import.meta.dirname ?? new URL(".", import.meta.url).pathname)

tsConfigPaths.register({
  baseUrl,
  paths: {
    "@/*": ["dist/src/*"],
    "@generated/*": ["dist/generated/*"],
  },
})