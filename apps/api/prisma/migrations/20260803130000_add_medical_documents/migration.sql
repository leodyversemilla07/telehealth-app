-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('LAB_RESULT', 'PRESCRIPTION', 'IMAGING', 'OTHER');

-- CreateTable
CREATE TABLE "medical_documents" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_documents_patientId_idx" ON "medical_documents"("patientId");

-- CreateIndex
CREATE INDEX "medical_documents_appointmentId_idx" ON "medical_documents"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "medical_documents_storageKey_key" ON "medical_documents"("storageKey");

-- AddForeignKey
ALTER TABLE "medical_documents" ADD CONSTRAINT "medical_documents_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;