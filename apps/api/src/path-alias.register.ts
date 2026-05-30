import { register } from "tsconfig-paths"

register({
  baseUrl: process.cwd(),
  paths: {
    "./*": ["src/*", "apps/api/src/*", "dist/src/*", "apps/api/dist/src/*"],
    "./generated/*": [
      "src/generated/*",
      "apps/api/src/generated/*",
      "dist/generated/*",
      "apps/api/dist/generated/*",
    ],
  },
})
