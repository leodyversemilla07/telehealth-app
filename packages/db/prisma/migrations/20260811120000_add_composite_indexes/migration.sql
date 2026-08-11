-- Composite indexes for the hot availability + chat query paths.
-- Availability lookups filter by (doctorId, status) then range on startTime;
-- chat conversation listing filters by (senderId, receiverId) pairs.
-- (The June performance-indexes migration created these, but
--  20260729090937_add_name_fields dropped them — re-adding here.)

CREATE INDEX "Appointment_doctorId_status_startTime_idx"
ON "appointments" ("doctorId", "status", "startTime");

CREATE INDEX "chat_messages_senderId_receiverId_idx"
ON "chat_messages" ("senderId", "receiverId");
