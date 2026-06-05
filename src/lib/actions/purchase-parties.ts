'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/lib/auth'
import { createAuditLog } from './logs'

// ── Suppliers (From Whom Purchase) ─────────────────────────────────────────

export async function getSuppliers() {
  return await prisma.purchaseSupplier.findMany({ orderBy: { name: 'asc' } })
}

export async function createSupplier(data: any) {
  const user = await getAuthSession()
  if (!user) throw new Error('Unauthorized')

  const { type, ...supplierData } = data
  const supplier = await prisma.purchaseSupplier.create({ data: supplierData })

  await createAuditLog(
    'CREATE',
    'SUPPLIER',
    supplier.id.toString(),
    `Created supplier ${supplier.name}`
  )

  revalidatePath('/purchase-suppliers')
}

export async function updateSupplier(id: number, data: any) {
  const user = await getAuthSession()
  if (!user) throw new Error('Unauthorized')

  const { type, ...supplierData } = data
  const supplier = await prisma.purchaseSupplier.update({ where: { id }, data: supplierData })

  await createAuditLog(
    'EDIT',
    'SUPPLIER',
    supplier.id.toString(),
    `Updated supplier ${supplier.name}`
  )

  revalidatePath('/purchase-suppliers')
}

export async function deleteSupplier(id: number) {
  const user = await getAuthSession()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can delete suppliers.')
  }

  const supplier = await prisma.purchaseSupplier.findUnique({ where: { id } })
  if (supplier) {
    await prisma.purchaseSupplier.delete({ where: { id } })

    await createAuditLog(
      'DELETE',
      'SUPPLIER',
      id.toString(),
      `Deleted supplier ${supplier.name}`
    )
  }

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
    address: profile.companyAddress || 'G-1, Diamond Tower, Surat, Gujarat',
    isCompany: true,
  }

  if (!companyBuyer) {
    // Create new default buyer with the default address
    await prisma.purchaseBuyer.create({
      data: {
        ...buyerData,
        city: 'Surat',
        state: 'Gujarat',
        stateCode: '24',
        type: 'Both'
      }
    })
  } else {
    // Sync name, gstin, pan, address if they differ
    if (
      companyBuyer.name !== buyerData.name ||
      companyBuyer.gstin !== buyerData.gstin ||
      companyBuyer.pan !== buyerData.pan ||
      companyBuyer.address !== buyerData.address
    ) {
      await prisma.purchaseBuyer.update({
        where: { id: companyBuyer.id },
        data: {
          name: buyerData.name,
          gstin: buyerData.gstin,
          pan: buyerData.pan,
          address: buyerData.address
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
  const user = await getAuthSession()
  if (!user) throw new Error('Unauthorized')

  const { bankerName, accountNo, ifsc, swiftCode, ...buyerData } = data
  const buyer = await prisma.purchaseBuyer.create({ data: { ...buyerData, isCompany: false } })

  await createAuditLog(
    'CREATE',
    'PARTY',
    buyer.id.toString(),
    `Created purchase buyer (company profile) ${buyer.name}`
  )

  revalidatePath('/purchase-buyers')
}

export async function updatePurchaseBuyer(id: number, data: any) {
  const user = await getAuthSession()
  if (!user) throw new Error('Unauthorized')

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

  const updatedBuyer = await prisma.purchaseBuyer.update({ where: { id }, data: updatedData })

  await createAuditLog(
    'EDIT',
    'PARTY',
    updatedBuyer.id.toString(),
    `Updated purchase buyer/consignee ${updatedBuyer.name}`
  )

  revalidatePath('/purchase-buyers')
}

export async function deletePurchaseBuyer(id: number) {
  const user = await getAuthSession()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can delete purchase buyers.')
  }

  const buyer = await prisma.purchaseBuyer.findUnique({ where: { id } })
  if (buyer?.isCompany) {
    throw new Error('Default company buyer profile cannot be deleted.')
  }
  
  if (buyer) {
    await prisma.purchaseBuyer.delete({ where: { id } })

    await createAuditLog(
      'DELETE',
      'PARTY',
      id.toString(),
      `Deleted purchase buyer/consignee ${buyer.name}`
    )
  }

  revalidatePath('/purchase-buyers')
}

