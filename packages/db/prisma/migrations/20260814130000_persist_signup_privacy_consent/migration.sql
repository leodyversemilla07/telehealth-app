-- Persist the privacy-policy acceptance as part of the same Better Auth user
-- creation transaction. ConsentLog remains the append-only preference history;
-- these fields are the durable signup-time proof even before email verification.
ALTER TABLE "User"
ADD COLUMN "privacyPolicyAcceptedAt" TIMESTAMP(3),
ADD COLUMN "privacyPolicyVersion" TEXT;
