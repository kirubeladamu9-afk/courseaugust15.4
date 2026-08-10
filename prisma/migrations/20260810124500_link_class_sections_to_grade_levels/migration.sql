ALTER TABLE "class_sections"
  ADD COLUMN IF NOT EXISTS "gradeLevelId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'class_sections_gradeLevelId_fkey') THEN
    ALTER TABLE "class_sections"
      ADD CONSTRAINT "class_sections_gradeLevelId_fkey"
      FOREIGN KEY ("gradeLevelId") REFERENCES "grade_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "class_sections_gradeLevelId_idx" ON "class_sections"("gradeLevelId");
