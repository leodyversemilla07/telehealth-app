-- AlterTable
-- Better-auth twoFactor plugin writes `verified`, `failedVerificationCount` and
-- omits createdAt/updatedAt on create, so those need DB defaults.
ALTER TABLE "twoFactor"
    ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP,
    ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "failedVerificationCount" INTEGER NOT NULL DEFAULT 0;