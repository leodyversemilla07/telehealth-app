/**
 * Mock for @generated/prisma/client.js — provides enums and a mock PrismaClient.
 * Jest can't resolve the Prisma generated client's internal relative imports.
 */

export type AppointmentStatus =
  | "BOOKED"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
export const AppointmentStatus = {
  BOOKED: "BOOKED",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const

export type VisitType = "VIDEO" | "PHONE" | "IN_PERSON"
export const VisitType = {
  VIDEO: "VIDEO",
  PHONE: "PHONE",
  IN_PERSON: "IN_PERSON",
} as const

export type Role = "PATIENT" | "DOCTOR" | "ADMIN"
export const Role = {
  PATIENT: "PATIENT",
  DOCTOR: "DOCTOR",
  ADMIN: "ADMIN",
} as const

export type NotificationType = "APPOINTMENT" | "SYSTEM" | "SECURITY"
export const NotificationType = {
  APPOINTMENT: "APPOINTMENT",
  SYSTEM: "SYSTEM",
  SECURITY: "SECURITY",
} as const

// Mock PrismaClient constructor — just returns an empty object with jest fns
export class PrismaClient {
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
  }
  patientProfile = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  }
  user = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  }
  $transaction = jest.fn((fn: (tx: unknown) => unknown) => fn(this))
  $connect = jest.fn()
  $disconnect = jest.fn()
}

export const Prisma = {
  AppointmentStatus,
  VisitType,
  Role,
  NotificationType,
}
