CREATE TABLE IF NOT EXISTS "teachers" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "gender" TEXT NOT NULL,
  "photoName" TEXT,
  "phoneNumber" TEXT,
  "address" TEXT,
  "nationalId" TEXT,
  "assignedSubjects" TEXT,
  "assignedClasses" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);
