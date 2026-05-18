import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const parties = await prisma.party.findMany()
  console.log('Parties:', JSON.stringify(parties, null, 2))
  
  const declarations = await prisma.declaration.findMany()
  console.log('Declarations:', JSON.stringify(declarations, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
