-- Rename Role enum value used by users.
ALTER TYPE "Role" RENAME VALUE 'PROVIDER' TO 'DOCTOR';

-- Rename provider profiles to doctor profiles.
ALTER TABLE "provider_profiles" RENAME TO "doctor_profiles";
ALTER INDEX "provider_profiles_userId_key" RENAME TO "doctor_profiles_userId_key";
ALTER INDEX "provider_profiles_prcLicenseNumber_key" RENAME TO "doctor_profiles_prcLicenseNumber_key";
ALTER TABLE "doctor_profiles" RENAME CONSTRAINT "provider_profiles_pkey" TO "doctor_profiles_pkey";

-- Convert the previous per-day availability rows into the current single
-- weekly schedule shape.
CREATE TABLE "availability_schedules" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "monday" TEXT NOT NULL DEFAULT '[]',
    "tuesday" TEXT NOT NULL DEFAULT '[]',
    "wednesday" TEXT NOT NULL DEFAULT '[]',
    "thursday" TEXT NOT NULL DEFAULT '[]',
    "friday" TEXT NOT NULL DEFAULT '[]',
    "saturday" TEXT NOT NULL DEFAULT '[]',
    "sunday" TEXT NOT NULL DEFAULT '[]',
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "availability_schedules_pkey" PRIMARY KEY ("id")
);

INSERT INTO "availability_schedules" (
    "id",
    "doctorId",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
    "slotDuration",
    "createdAt",
    "updatedAt"
)
SELECT
    'schedule_' || d."id",
    d."id",
    COALESCE(json_agg(a."startTime" || '-' || a."endTime") FILTER (WHERE a."dayOfWeek" = 1 AND a."isActive")::text, '[]'),
    COALESCE(json_agg(a."startTime" || '-' || a."endTime") FILTER (WHERE a."dayOfWeek" = 2 AND a."isActive")::text, '[]'),
    COALESCE(json_agg(a."startTime" || '-' || a."endTime") FILTER (WHERE a."dayOfWeek" = 3 AND a."isActive")::text, '[]'),
    COALESCE(json_agg(a."startTime" || '-' || a."endTime") FILTER (WHERE a."dayOfWeek" = 4 AND a."isActive")::text, '[]'),
    COALESCE(json_agg(a."startTime" || '-' || a."endTime") FILTER (WHERE a."dayOfWeek" = 5 AND a."isActive")::text, '[]'),
    COALESCE(json_agg(a."startTime" || '-' || a."endTime") FILTER (WHERE a."dayOfWeek" = 6 AND a."isActive")::text, '[]'),
    COALESCE(json_agg(a."startTime" || '-' || a."endTime") FILTER (WHERE a."dayOfWeek" = 0 AND a."isActive")::text, '[]'),
    COALESCE(MIN(a."slotDuration"), 30),
    MIN(COALESCE(a."createdAt", CURRENT_TIMESTAMP)),
    MAX(COALESCE(a."updatedAt", CURRENT_TIMESTAMP))
FROM "doctor_profiles" d
LEFT JOIN "availabilities" a ON a."providerId" = d."id"
GROUP BY d."id";

CREATE UNIQUE INDEX "availability_schedules_doctorId_key" ON "availability_schedules"("doctorId");
ALTER TABLE "availability_schedules" ADD CONSTRAINT "availability_schedules_doctorId_fkey"
    FOREIGN KEY ("doctorId") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Convert time-off rows to schedule-owned date ranges.
CREATE TABLE "time_offs" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "time_offs_pkey" PRIMARY KEY ("id")
);

INSERT INTO "time_offs" ("id", "scheduleId", "startDate", "endDate", "reason", "createdAt")
SELECT
    t."id",
    'schedule_' || t."providerId",
    (t."date"::text || 'T' || t."startTime" || ':00')::timestamp,
    (t."date"::text || 'T' || t."endTime" || ':00')::timestamp,
    t."reason",
    t."createdAt"
FROM "time_off" t
WHERE EXISTS (
    SELECT 1 FROM "availability_schedules" s WHERE s."id" = 'schedule_' || t."providerId"
);

ALTER TABLE "time_offs" ADD CONSTRAINT "time_offs_scheduleId_fkey"
    FOREIGN KEY ("scheduleId") REFERENCES "availability_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Rename appointment provider fields and attach each appointment to its
-- doctor's schedule.
ALTER TABLE "appointments" RENAME COLUMN "providerId" TO "doctorId";
ALTER INDEX "appointments_providerId_idx" RENAME TO "appointments_doctorId_idx";
ALTER TABLE "appointments" RENAME CONSTRAINT "appointments_providerId_fkey" TO "appointments_doctorId_fkey";

ALTER TABLE "appointments" ADD COLUMN "scheduleId" TEXT;
ALTER TABLE "appointments" ADD COLUMN "roomUrl" TEXT;

UPDATE "appointments" SET "scheduleId" = 'schedule_' || "doctorId";

ALTER TABLE "appointments" ALTER COLUMN "scheduleId" SET NOT NULL;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_scheduleId_fkey"
    FOREIGN KEY ("scheduleId") REFERENCES "availability_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments" DROP COLUMN IF EXISTS "prescription";

-- Move prescriptions and consultation notes into dedicated medical-record
-- tables.
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientNotes" TEXT,
    "doctorNotes" TEXT,
    "diagnosis" TEXT,
    "plan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "consultations_appointmentId_key" ON "consultations"("appointmentId");
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "prescriptions" (
    "id" TEXT NOT NULL,
    "consultationId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_consultationId_fkey"
    FOREIGN KEY ("consultationId") REFERENCES "consultations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Convert notifications.type from loose text to the app enum.
CREATE TYPE "NotificationType" AS ENUM (
    'APPOINTMENT_REMINDER',
    'APPOINTMENT_CONFIRMATION',
    'APPOINTMENT_CANCELLED',
    'NEW_MESSAGE',
    'SCHEDULE_UPDATED',
    'SYSTEM'
);

ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType"
USING CASE
    WHEN "type" IN (
        'APPOINTMENT_REMINDER',
        'APPOINTMENT_CONFIRMATION',
        'APPOINTMENT_CANCELLED',
        'NEW_MESSAGE',
        'SCHEDULE_UPDATED',
        'SYSTEM'
    ) THEN "type"::"NotificationType"
    ELSE 'SYSTEM'::"NotificationType"
END;

DROP TABLE "time_off";
DROP TABLE "availabilities";
