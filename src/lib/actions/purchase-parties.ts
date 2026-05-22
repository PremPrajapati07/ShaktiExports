'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ── Suppliers (From Whom Purchase) ─────────────────────────────────────────

export async function getSuppliers() {
  return await prisma.purchaseSupplier.findMany({ orderBy: { name: 'asc' } })
}

export async function createSupplier(data: any) {
  const { type, ...supplierData } = data
  await prisma.purchaseSupplier.create({ data: supplierData })
  revalidatePath('/purchase-suppliers')
}

export async function updateSupplier(id: number, data: any) {
  const { type, ...supplierData } = data
  await prisma.purchaseSupplier.update({ where: { id }, data: supplierData })
  revalidatePath('/purchase-suppliers')
}

export async function deleteSupplier(id: number) {
  await prisma.purchaseSupplier.delete({ where: { id } })
  revalidatePath('/purchase-suppliers')
}

// ── Buyers (Who Purchased) ─────────────────────────────────────────────────

export async function syncCompanyBuyer() {
  // Get company profile (id: 1)
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

  // Find if a company buyer already exists
  const companyBuyer = await prisma.purchaseBuyer.findFirst({
    where: { isCompany: true }
  })

  const buyerData = {
    name: profile.companyName || 'SHAKTI EXPORTS',
    gstin: profile.gstin || '24AAAAA0000A1Z5',
    pan: profile.pan || 'ABCDE1234F',
    isCompany: true,
  }

  if (!companyBuyer) {
    // Create new default buyer with the default address
    await prisma.purchaseBuyer.create({
      data: {
        ...buyerData,
        address: 'G-1, Diamond Tower',
        city: 'Surat',
        state: 'Gujarat',
        stateCode: '24',
        type: 'Both'
      }
    })
  } else {
    // Sync name, gstin, pan if they differ
    if (
      companyBuyer.name !== buyerData.name ||
      companyBuyer.gstin !== buyerData.gstin ||
      companyBuyer.pan !== buyerData.pan
    ) {
      await prisma.purchaseBuyer.update({
        where: { id: companyBuyer.id },
        data: {
          name: buyerData.name,
          gstin: buyerData.gstin,
          pan: buyerData.pan
        }
      })
    }
  }
}

export async function getPurchaseBuyers() {
  await syncCompanyBuyer()
  return await prisma.purchaseBuyer.findMany({ orderBy: { name: 'asc' } })
}

export async function createPurchaseBuyer(data: any) {
  const { bankerName, accountNo, ifsc, swiftCode, ...buyerData } = data
  await prisma.purchaseBuyer.create({ data: { ...buyerData, isCompany: false } })
  revalidatePath('/purchase-buyers')
}

export async function updatePurchaseBuyer(id: number, data: any) {
  const { bankerName, accountNo, ifsc, swiftCode, ...buyerData } = data
  const buyer = await prisma.purchaseBuyer.findUnique({ where: { id } })
  
  // If editing company profile buyer, ensure isCompany stays true and name/gstin/pan match profile
  const updatedData = { ...buyerData }
  if (buyer?.isCompany) {
    const profile = await prisma.profile.findUnique({ where: { id: 1 } })
    if (profile) {
      updatedData.name = profile.companyName
      updatedData.gstin = profile.gstin
      updatedData.pan = profile.pan
      updatedData.isCompany = true
    }
  }

  await prisma.purchaseBuyer.update({ where: { id }, data: updatedData })
  revalidatePath('/purchase-buyers')
}

export async function deletePurchaseBuyer(id: number) {
  const buyer = await prisma.purchaseBuyer.findUnique({ where: { id } })
  if (buyer?.isCompany) {
    throw new Error('Default company buyer profile cannot be deleted.')
  }
  await prisma.purchaseBuyer.delete({ where: { id } })
  revalidatePath('/purchase-buyers')
}

