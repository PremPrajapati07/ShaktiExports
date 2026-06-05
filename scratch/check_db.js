const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const profiles = await prisma.profile.findMany()
  console.log('=== PROFILES IN DB ===')
  console.log(JSON.stringify(profiles, null, 2))

  const buyers = await prisma.purchaseBuyer.findMany({ where: { isCompany: true } })
  console.log('=== COMPANY BUYERS IN DB ===')
  console.log(JSON.stringify(buyers, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
