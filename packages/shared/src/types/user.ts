import type { z } from "zod"
import type {
  publicUserSchema,
  roleSchema,
  userSchema,
} from "../schemas/user.schema.js"

export type Role = z.infer<typeof roleSchema>
export type UserDto = z.infer<typeof userSchema>
export type PublicUserDto = z.infer<typeof publicUserSchema>

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
