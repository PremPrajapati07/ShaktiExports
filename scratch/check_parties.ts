import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const parties = await prisma.party.findMany()
  console.log(JSON.stringify(parties, null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
