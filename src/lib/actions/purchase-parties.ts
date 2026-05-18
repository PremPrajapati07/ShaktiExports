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

export async function getPurchaseBuyers() {
  return await prisma.purchaseBuyer.findMany({ orderBy: { name: 'asc' } })
}

export async function createPurchaseBuyer(data: any) {
  const { bankerName, accountNo, ifsc, swiftCode, ...buyerData } = data
  await prisma.purchaseBuyer.create({ data: buyerData })
  revalidatePath('/purchase-buyers')
}

export async function updatePurchaseBuyer(id: number, data: any) {
  const { bankerName, accountNo, ifsc, swiftCode, ...buyerData } = data
  await prisma.purchaseBuyer.update({ where: { id }, data: buyerData })
  revalidatePath('/purchase-buyers')
}

export async function deletePurchaseBuyer(id: number) {
  await prisma.purchaseBuyer.delete({ where: { id } })
  revalidatePath('/purchase-buyers')
}

