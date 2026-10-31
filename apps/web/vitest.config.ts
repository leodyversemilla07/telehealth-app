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
      // Anti-regression gate, not aspirational: thresholds sit ~5pt under
      // today's numbers (75.9/64.5/71.2/76.6) so unrelated PRs can't dip
      // the suite. This now clears API parity (60/55/62/60) on every metric;
      // the remaining depth is in the symptom-checker and booking pages.
      thresholds: {
        statements: 71,
        branches: 60,
        functions: 66,
        lines: 71,
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
