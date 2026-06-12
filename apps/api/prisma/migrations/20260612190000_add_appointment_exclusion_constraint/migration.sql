-- Prevent double-booking: overlapping active appointments for the same doctor
-- Uses a partial unique index as a lightweight guard (covers exact same start+end).
-- The application-level $transaction check handles the full overlap window.

-- Composite index to speed up the overlap check query
CREATE INDEX "appointments_doctorId_startTime_endTime_status_idx"
  ON "appointments" ("doctorId", "startTime", "endTime", "status");

-- Partial unique index: prevents two active appointments with identical times for the same doctor
CREATE UNIQUE INDEX "appointments_doctor_start_unique_active"
  ON "appointments" ("doctorId", "startTime", "endTime")
  WHERE "status" IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS');
