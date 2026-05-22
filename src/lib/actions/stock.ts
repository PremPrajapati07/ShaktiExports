'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getStockOverview() {
  const stocks = await prisma.stock.findMany()
  const labGrown = stocks.find(s => s.diamondType === 'LabGrown')?.totalCarats || 0
  const natural = stocks.find(s => s.diamondType === 'Natural')?.totalCarats || 0
  
  return {
    labGrown,
    natural
  }
}

export async function getStockLedger(diamondType?: 'LabGrown' | 'Natural') {
  const where = diamondType ? { diamondType } : {}
  return await prisma.stockLedger.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  })
}

export async function getPartyLedger(partyId: number, partyType: 'SUPPLIER' | 'BUYER' | 'MANUAL') {
  return await prisma.stockLedger.findMany({
    where: { partyId, partyType },
    orderBy: { createdAt: 'desc' }
  })
}

export async function adjustStockManually(data: {
  diamondType: 'LabGrown' | 'Natural',
  carats: number,
  remarks: string
}) {
  const { diamondType, carats, remarks } = data
  
  if (carats === 0) throw new Error("Carats cannot be 0")
  if (!remarks) throw new Error("Remarks are required for manual adjustments")

  await prisma.$transaction(async (tx) => {
    await tx.stockLedger.create({
      data: {
        diamondType,
        date: new Date(),
        transactionType: 'MANUAL_ADJUSTMENT',
        carats: Math.abs(carats),
        referenceNo: 'Manual Adj',
        partyType: 'MANUAL',
        remarks
      }
    })

    await tx.stock.upsert({
      where: { diamondType },
      update: { totalCarats: { increment: carats } },
      create: { id: diamondType, diamondType, totalCarats: carats }
    })
  })

  revalidatePath('/stock')
}
