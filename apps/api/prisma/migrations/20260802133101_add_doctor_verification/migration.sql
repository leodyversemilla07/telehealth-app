-- AlterTable
ALTER TABLE "doctor_profiles" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;
