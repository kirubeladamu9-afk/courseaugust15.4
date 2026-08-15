ALTER TABLE "users" ADD COLUMN "student_id" TEXT;

UPDATE "users" AS "user"
SET "student_id" = "student"."id"
FROM "students" AS "student"
WHERE "user"."role" = 'STUDENT'
  AND "user"."student_id" IS NULL
  AND LOWER("user"."name") = LOWER("student"."fullName");

UPDATE "users" AS "user"
SET "student_id" = "student"."id"
FROM "students" AS "student"
WHERE "user"."role" = 'STUDENT'
  AND "user"."student_id" IS NULL
  AND "user"."username" LIKE '%.' || RIGHT("student"."id", 6)
  AND 1 = (
    SELECT COUNT(*)
    FROM "users" AS "candidate"
    WHERE "candidate"."role" = 'STUDENT'
      AND "candidate"."student_id" IS NULL
      AND "candidate"."username" LIKE '%.' || RIGHT("student"."id", 6)
  );

CREATE UNIQUE INDEX "users_student_id_key" ON "users"("student_id");

ALTER TABLE "users"
ADD CONSTRAINT "users_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;
