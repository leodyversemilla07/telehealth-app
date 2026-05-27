-- AlterTable
ALTER TABLE "patient_profiles" ADD COLUMN "weight" DOUBLE PRECISION;
ALTER TABLE "patient_profiles" ADD COLUMN "height" DOUBLE PRECISION;
ALTER TABLE "patient_profiles" ADD COLUMN "medicalHistory" JSONB;
