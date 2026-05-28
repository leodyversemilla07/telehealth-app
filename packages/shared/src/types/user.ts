import type { z } from "zod"
import type {
  doctorProfileSchema,
  patientProfileSchema,
  publicUserSchema,
  roleSchema,
  userSchema,
} from "../schemas/user.schema.js"

export type Role = z.infer<typeof roleSchema>
export type UserDto = z.infer<typeof userSchema>
export type PublicUserDto = z.infer<typeof publicUserSchema>
export type PatientProfileDto = z.infer<typeof patientProfileSchema>
export type DoctorProfileDto = z.infer<typeof doctorProfileSchema>

export interface UserSessionDto {
  id: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  expiresAt: string
  isCurrent: boolean
}

export interface AuditLogDto {
  id: string
  action: string
  actorId: string
  actorEmail: string
  targetId: string | null
  targetEmail: string | null
  reason: string | null
  timestamp: string
}

export interface SecurityAlertDto {
  id: string
  userId: string
  title: string
  message: string
  ipAddress: string | null
  userAgent: string | null
  read: boolean
  createdAt: string
}

export interface ConsentLogDto {
  id: string
  userId: string
  consentType: string
  granted: boolean
  ipAddress: string | null
  createdAt: string
}
