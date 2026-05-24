import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@workspace/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
})
