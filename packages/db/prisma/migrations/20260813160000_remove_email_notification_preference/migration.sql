-- Email notification delivery is not implemented; remove its inactive preference.
ALTER TABLE "notification_preferences" DROP COLUMN "emailEnabled";
