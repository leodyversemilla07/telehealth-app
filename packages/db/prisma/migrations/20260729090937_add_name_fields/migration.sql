-- DropIndex
DROP INDEX "appointments_doctorId_startTime_endTime_status_idx";

-- DropIndex
DROP INDEX "appointments_status_idx";

-- DropIndex
DROP INDEX "chat_messages_receiverId_isRead_idx";

-- DropIndex
DROP INDEX "chat_messages_senderId_receiverId_idx";

-- DropIndex
DROP INDEX "doctor_profiles_isApproved_idx";

-- DropIndex
DROP INDEX "notifications_userId_isRead_idx";

-- DropIndex
DROP INDEX "reviews_doctorId_rating_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT,
ADD COLUMN     "middleName" TEXT;

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "appointmentReminder" BOOLEAN NOT NULL DEFAULT true,
    "appointmentConfirmation" BOOLEAN NOT NULL DEFAULT true,
    "appointmentCancelled" BOOLEAN NOT NULL DEFAULT true,
    "newMessage" BOOLEAN NOT NULL DEFAULT true,
    "scheduleUpdated" BOOLEAN NOT NULL DEFAULT true,
    "system" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
