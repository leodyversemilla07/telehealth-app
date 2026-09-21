-- Enforce F-APPT-04 at the database boundary. The previous partial unique
-- index only rejected appointments with identical start/end timestamps; two
-- concurrent requests for partially overlapping ranges could both commit.
--
-- Prisma DateTime columns are PostgreSQL TIMESTAMP(3), so use tsrange. The
-- half-open [start, end) range permits adjacent appointments (10:00-10:30 and
-- 10:30-11:00) while rejecting every true overlap for active statuses.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_doctor_active_time_excl"
  EXCLUDE USING gist (
    "doctorId" WITH =,
    tsrange("startTime", "endTime", '[)') WITH &&
  )
  WHERE ("status" IN ('BOOKED', 'CONFIRMED', 'IN_PROGRESS'));

-- Superseded by the range exclusion constraint above.
DROP INDEX IF EXISTS "appointments_doctor_start_unique_active";
