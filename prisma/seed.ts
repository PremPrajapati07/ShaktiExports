import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const username = 'admin'
  const rawPassword = 'admin'
  const hashedPassword = await bcrypt.hash(rawPassword, 10)

  const admin = await prisma.user.upsert({
    where: { username },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      username,
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log(`Admin user seeded: ${admin.username}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
