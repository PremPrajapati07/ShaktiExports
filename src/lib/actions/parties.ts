'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/lib/auth'
import { createAuditLog } from './logs'

export async function getParties() {
  return await prisma.party.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function createParty(data: any) {
  const user = await getAuthSession()
  if (!user) throw new Error('Unauthorized')

  const party = await prisma.party.create({
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      stateCode: data.stateCode,
      gstin: data.gstin,
      pan: data.pan,
      type: data.type || 'Both',
    }
  })

  await createAuditLog(
    'CREATE',
    'PARTY',
    party.id.toString(),
    `Created party ${party.name} (${party.type})`
  )

  revalidatePath('/', 'layout')
  return party
}

export async function updateParty(id: number, data: any) {
  const user = await getAuthSession()
  if (!user) throw new Error('Unauthorized')

  const party = await prisma.party.update({
    where: { id },
    data: {
      name: data.name,
      address: data.address,
      city: data.city,
      state: data.state,
      stateCode: data.stateCode,
      gstin: data.gstin,
      pan: data.pan,
      type: data.type || 'Both',
    }
  })

  await createAuditLog(
    'EDIT',
    'PARTY',
    party.id.toString(),
    `Updated party ${party.name} (${party.type})`
  )

  revalidatePath('/', 'layout')
  return party
}

export async function deleteParty(id: number) {
  const user = await getAuthSession()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can delete parties.')
  }

  const party = await prisma.party.findUnique({ where: { id } })
  if (party) {
    await prisma.party.delete({
      where: { id }
    })

    await createAuditLog(
      'DELETE',
      'PARTY',
      id.toString(),
      `Deleted party ${party.name}`
    )
  }

  revalidatePath('/', 'layout')
}
