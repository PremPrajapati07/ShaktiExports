import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing database...')
  
  // Clear tables in correct order to avoid FK issues
  await prisma.lineItem.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.party.deleteMany({})
  await prisma.declaration.deleteMany({})
  await prisma.counter.deleteMany({})

  console.log('Seeding data...')

  // 1. Manage Parties
  await prisma.party.create({
    data: {
      name: 'Mehzab Jewellery',
      address: '192-L Model Town Jalandhar Punjab',
      city: 'Jalandhar',
      state: 'Punjab',
      stateCode: '03',
      gstin: '03ADKPN6562B2ZQ',
      pan: 'ADKPN6562B',
      type: 'BilledTo'
    }
  })

  // 2. Manage Consignees
  await prisma.party.create({
    data: {
      name: 'Mehzab Jewellery',
      address: '192-L Model Town Jalandhar Punjab',
      city: 'Jalandhar',
      state: 'Punjab',
      stateCode: '03',
      gstin: '03ADKPN6562B2ZQ',
      pan: 'ADKPN6562B',
      type: 'ShippedTo'
    }
  })

  // 3. Declarations
  await prisma.declaration.create({
    data: {
      title: 'Standard Conflict-Free Declaration',
      body: `The Diamonds herein invoiced have been purchased from Legitimate sources not involved in funding conflict & in Compliances with United Nations resolutions. The seller here by guarantees that these diamonds are conflict free, based on personal knowledge, and/or written guarantees provided by the supplier of these diamonds.
      
The diamonds are Natural and Untreated unless specified otherwise. The acceptance of goods herein invoiced will be as per the WFDB guidelines.

The diamonds have been purchases from legitimate sources and not involved in funding conflict and are in compliance with the UN resolution.

The diamonds have not been obtained in violation of applicable National laws and / or sanctions by the U.S. department of Treasury's Office of foreign assets Control (OFAC).

Any dispute arising out of this invoice shall be subject to exclusive jurisdiction of Surat Courts only.`
    }
  })

  console.log('Database seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
