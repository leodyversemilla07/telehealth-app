import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
    // Page renders (e.g. book-appointment) import large component trees;
    // give parallel workers headroom so 1s testing-library waits don't trip.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "./coverage",
      // Anti-regression gate, not aspirational: thresholds sit ~4-5pt under
      // today's numbers (64.3/58.4/53.3/64.9) so unrelated PRs can't dip
      // the suite. Tracked toward API parity (60/55/62/60); statements and
      // lines already exceed it — remaining gap is branch/function depth in
      // the admin and settings pages.
      thresholds: {
        statements: 59,
        branches: 53,
        functions: 47,
        lines: 59,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@workspace/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
})
