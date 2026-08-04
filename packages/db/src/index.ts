// Docs-standard package boundary (prisma.io/docs/guides/deployment/turborepo):
// consumers import `import { prisma } from "@telehealth/db"` and get the
// singleton instance plus every generated type/enum — never the raw path.

export * from "../generated/prisma/client.js"
export { prisma } from "./client.js"
