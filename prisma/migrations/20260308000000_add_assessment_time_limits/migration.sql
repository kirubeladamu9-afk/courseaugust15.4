ALTER TABLE "quizzes"
ADD COLUMN IF NOT EXISTS "time_limit_minutes" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "assessment_assignments"
ADD COLUMN IF NOT EXISTS "time_limit_minutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN IF NOT EXISTS "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "ends_at" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 minutes');

UPDATE "assessment_assignments"
SET "ends_at" = "starts_at" + ("time_limit_minutes" * INTERVAL '1 minute')
WHERE "ends_at" = "starts_at" + INTERVAL '30 minutes';
