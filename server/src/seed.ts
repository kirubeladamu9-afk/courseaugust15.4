import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient, UserRole, AccountStatus } from '@prisma/client'

const prisma = new PrismaClient()

const users = [
  { name: 'Admin User', username: 'admin', email: 'admin@coursespace.com', password: 'Admin123!', role: UserRole.ADMIN },
  { name: 'Teacher User', username: 'teacher', email: 'teacher@coursespace.com', password: 'Teacher123!', role: UserRole.TEACHER },
  { name: 'Parent User', username: 'parent', email: 'parent@coursespace.com', password: 'Parent123!', role: UserRole.PARENT },
  { name: 'Student User', username: 'student', email: 'student@coursespace.com', password: 'Student123!', role: UserRole.STUDENT },
]

for (const user of users) {
  await prisma.user.upsert({
    where: { username: user.username },
    update: { name: user.name, email: user.email, passwordHash: await bcrypt.hash(user.password, 12), role: user.role, status: AccountStatus.ACTIVE },
    create: { name: user.name, username: user.username, email: user.email, passwordHash: await bcrypt.hash(user.password, 12), role: user.role, status: AccountStatus.ACTIVE },
  })
}

await prisma.$disconnect()
