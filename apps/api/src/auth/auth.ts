// The Better Auth server instance. The full configuration lives in
// packages/auth (createAuth) — this file only wires in the API's own
// dependencies (Prisma client + email transport).
//
// ENV TIMING: main.ts loads .env BEFORE this module is imported (see its
// first line) — better-auth's module graph snapshots NODE_ENV and the auth
// secret at import time.
import { createAuth } from "@telehealth/auth"
import { sendEmail, sendSecurityAlertEmail } from "../common/utils/email"
import { prisma } from "../prisma/prisma-client"

export const auth = createAuth({
  prisma,
  sendEmail,
  sendSecurityAlertEmail,
})
