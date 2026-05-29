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

export type NotificationType =
  | "APPOINTMENT_REMINDER"
  | "APPOINTMENT_CONFIRMATION"
  | "APPOINTMENT_CANCELLED"
  | "NEW_MESSAGE"
  | "SCHEDULE_UPDATED"
  | "SYSTEM"
export const NotificationType = {
  APPOINTMENT_REMINDER: "APPOINTMENT_REMINDER",
  APPOINTMENT_CONFIRMATION: "APPOINTMENT_CONFIRMATION",
  APPOINTMENT_CANCELLED: "APPOINTMENT_CANCELLED",
  NEW_MESSAGE: "NEW_MESSAGE",
  SCHEDULE_UPDATED: "SCHEDULE_UPDATED",
  SYSTEM: "SYSTEM",
} as const

// Helper type that turns all object methods into jest.Mock so tests can call .mockResolvedValue()
export type Mockify<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown
    ? jest.Mock
    : T[K] extends Record<string, unknown>
      ? Mockify<T[K]>
      : T[K]
}

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
    count: jest.fn(),
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
    count: jest.fn(),
  }
  notification = {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    create: jest.fn(),
  }
  review = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  }
  timeOff = {
    findFirst: jest.fn(),
    delete: jest.fn(),
  }
  availabilitySchedule = {
    findUnique: jest.fn(),
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
