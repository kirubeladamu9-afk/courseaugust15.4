CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TEACHER', 'PARENT', 'STUDENT');
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DISABLED');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
  "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  "lockedUntil" TIMESTAMP(3),
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_username_idx" ON "users"("username");

INSERT INTO "users" ("id", "name", "username", "email", "passwordHash", "role", "status", "updatedAt") VALUES
  ('admin-1', 'Admin User', 'admin', 'admin@coursespace.com', '$2b$12$f6XL3RfNbmqwO3LPG3d8ieKSbNdzTp08h9PzedgJo4wm86oA3Pqn6', 'ADMIN', 'ACTIVE', CURRENT_TIMESTAMP),
  ('teacher-1', 'Teacher User', 'teacher', 'teacher@coursespace.com', '$2b$12$IGZcBeWmKKzT3oG0xG0GguXjutVYm9pO8YPmEOgwAEhI3nDXiBFjW', 'TEACHER', 'ACTIVE', CURRENT_TIMESTAMP),
  ('parent-1', 'Parent User', 'parent', 'parent@coursespace.com', '$2b$12$AFt9Em7bhPG46mFO7uSoFORPcQM.MELtWvqUJ003DYMpHmPUhRGGm', 'PARENT', 'ACTIVE', CURRENT_TIMESTAMP),
  ('student-1', 'Student User', 'student', 'student@coursespace.com', '$2b$12$pkHZl2mZSQrDl9hb.ay.i.JkWxgp/RZCrc4IyT3uIFCCJOi3iXpDi', 'STUDENT', 'ACTIVE', CURRENT_TIMESTAMP);
