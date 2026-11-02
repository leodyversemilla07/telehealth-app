-- Enforce non-overlapping time-off blocks at the database boundary.
-- Half-open ranges permit adjacent blocks while rejecting true overlaps.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "time_offs"
  ADD CONSTRAINT "time_offs_schedule_time_excl"
  EXCLUDE USING gist (
    "scheduleId" WITH =,
    tsrange("startDate", "endDate", '[)') WITH &&
  );
