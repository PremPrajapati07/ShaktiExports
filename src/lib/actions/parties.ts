'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getParties() {
  return await prisma.party.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function createParty(data: any) {
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
  revalidatePath('/', 'layout')
  return party
}

export async function updateParty(id: number, data: any) {
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
  revalidatePath('/', 'layout')
  return party
}

export async function deleteParty(id: number) {
  await prisma.party.delete({
    where: { id }
  })
  revalidatePath('/', 'layout')
}
