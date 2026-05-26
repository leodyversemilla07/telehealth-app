-- RenameTable: provider_profiles → doctor_profiles
ALTER TABLE "provider_profiles" RENAME TO "doctor_profiles";

-- RenameColumn: AvailabilitySchedule.providerId → doctorId
ALTER TABLE "availability_schedules" RENAME COLUMN "providerId" TO "doctorId";

-- RenameColumn: Appointment.providerId → doctorId
ALTER TABLE "appointments" RENAME COLUMN "providerId" TO "doctorId";

-- Rename the FK constraint on AvailabilitySchedule (Prisma auto-generates these)
ALTER TABLE "availability_schedules" RENAME CONSTRAINT "AvailabilitySchedule_providerId_fkey" TO "AvailabilitySchedule_doctorId_fkey";

-- Rename the FK constraint on Appointment
ALTER TABLE "appointments" RENAME CONSTRAINT "Appointment_providerId_fkey" TO "Appointment_doctorId_fkey";

-- Rename unique index on AvailabilitySchedule
ALTER INDEX "availability_schedules_providerId_key" RENAME TO "availability_schedules_doctorId_key";

-- Rename index on Appointment.providerId → doctorId
ALTER INDEX "appointments_providerId_idx" RENAME TO "appointments_doctorId_idx";
