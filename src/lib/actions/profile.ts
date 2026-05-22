'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getProfile() {
  let profile = await prisma.profile.findUnique({ where: { id: 1 } })
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        id: 1,
        companyName: 'SHAKTI EXPORTS',
        gstin: '24AAAAA0000A1Z5',
        pan: 'ABCDE1234F',
        terms: 'CREDIT',
        banker: 'STATE BANK OF INDIA',
        accountNo: '12345678901',
        ifsc: 'SBIN0000001',
        swiftCode: '',
        districtOriginCode: '24'
      }
    })
  }
  return profile
}

export async function updateProfile(data: any) {
  const profile = await prisma.profile.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data }
  })
  try {
    const { syncCompanyBuyer } = await import('./purchase-parties')
    await syncCompanyBuyer()
  } catch (err) {
    console.error('Failed to sync company buyer during profile update:', err)
  }
  revalidatePath('/', 'layout')
  return profile
}
