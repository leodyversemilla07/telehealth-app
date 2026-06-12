-- Performance indexes for commonly queried columns

-- Appointments: status filter used in reminders, dashboard stats, and conflict checks
CREATE INDEX "appointments_status_idx" ON "appointments" ("status");

-- DoctorProfile: isApproved filter used in search and dashboard stats
CREATE INDEX "doctor_profiles_isApproved_idx" ON "doctor_profiles" ("isApproved");

-- Notification: composite index for unread count queries
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications" ("userId", "isRead");

-- ChatMessage: composite index for conversation queries
CREATE INDEX "chat_messages_senderId_receiverId_idx" ON "chat_messages" ("senderId", "receiverId");

-- ChatMessage: composite index for unread count queries
CREATE INDEX "chat_messages_receiverId_isRead_idx" ON "chat_messages" ("receiverId", "isRead");

-- Review: composite index for doctor rating aggregation
CREATE INDEX "reviews_doctorId_rating_idx" ON "reviews" ("doctorId", "rating");
