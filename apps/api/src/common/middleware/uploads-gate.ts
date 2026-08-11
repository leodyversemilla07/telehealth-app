import type { PrismaService } from "../../prisma/prisma.service"

/**
 * The session user shape needed for the uploads gate (a subset of the
 * Better Auth session user object attached by auth.api.getSession).
 */
export interface UploadsGateUser {
  id: string
  role?: string | null
}

export type UploadsGateDecision =
  | { allow: true; reason: "avatar" | "owner" }
  | { allow: false; reason: "not-found" | "forbidden" }

/**
 * Authorization for direct GET /uploads/:key reads.
 *
 * Policy (mirrors DocumentsService.assertAppointmentAccess):
 * - `avatar-*` keys are public (rendered on public doctor cards).
 * - every other key must be a MedicalDocument the session user may read:
 *   the appointment's patient, its assigned doctor, or an admin.
 * - unknown keys yield `not-found` (never leak key validity to callers).
 *
 * main.ts streams the object only when this returns allow; anything else
 * short-circuits with 401/403/404. Note the storage read itself is skipped
 * for forbidden keys, so an unauthorized caller cannot probe S3 objects.
 */
export async function authorizeUploadsKey(
  prisma: PrismaService,
  user: UploadsGateUser | undefined,
  key: string,
): Promise<UploadsGateDecision> {
  if (key.startsWith("avatar-")) return { allow: true, reason: "avatar" }
  if (!user) return { allow: false, reason: "forbidden" }

  const doc = await prisma.medicalDocument.findFirst({
    where: { storageKey: key },
    select: {
      appointment: {
        select: {
          patientId: true,
          doctor: { select: { userId: true } },
        },
      },
    },
  })
  if (!doc) return { allow: false, reason: "not-found" }

  const isPatient = doc.appointment.patientId === user.id
  const isDoctor = doc.appointment.doctor.userId === user.id
  const allowed = isPatient || isDoctor || user.role === "ADMIN"
  return allowed
    ? { allow: true as const, reason: "owner" as const }
    : { allow: false as const, reason: "forbidden" as const }
}
