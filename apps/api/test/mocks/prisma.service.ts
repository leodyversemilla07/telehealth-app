/**
 * Mock for @/prisma/prisma.service — avoids importing PrismaClient
 * which has complex generated code that Jest can't resolve.
 *
 * Usage in jest moduleNameMapper:
 *   "^@/prisma/prisma\\.service$": "<rootDir>/../test/mocks/prisma.service.ts"
 */

export class PrismaService {
  appointment = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  }

  doctorProfile = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  }

  patientProfile = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  }

  availabilitySchedule = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }

  schedule = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  }

  timeOff = {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  }

  user = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  }

  consent = {
    create: jest.fn(),
    findMany: jest.fn(),
  }

  auditLog = {
    create: jest.fn(),
    findMany: jest.fn(),
  }

  notification = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
  }

  notificationPreference = {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  }

  pushSubscription = {
    create: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  }

  consultation = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  }

  prescription = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  }

  securityAlert = {
    create: jest.fn(),
    findMany: jest.fn(),
  }

  $transaction = jest.fn((fn) => fn(this))
  $queryRaw = jest.fn()
  $executeRaw = jest.fn()
}
