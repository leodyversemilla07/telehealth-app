/**
 * Mock for @telehealth/db (the shared Prisma package).
 *
 * Jest must not load the real package: its generated client is CJS-compiled
 * for Node, and its singleton constructs a driver adapter that requires
 * DATABASE_URL. Re-export the existing generated-client mock (enums +
 * mock PrismaClient) and expose a `prisma` singleton instance.
 */
export * from "./prisma-client"

import { PrismaClient } from "./prisma-client"

export const prisma = new PrismaClient()
