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
  remarks: string,
  date?: string | Date
}) {
  const { diamondType, carats, remarks, date } = data
  
  if (carats === 0) throw new Error("Carats cannot be 0")
  if (!remarks) throw new Error("Remarks are required for manual adjustments")

  await prisma.$transaction(async (tx) => {
    await tx.stockLedger.create({
      data: {
        diamondType,
        date: date ? new Date(date) : new Date(),
        transactionType: 'MANUAL_ADJUSTMENT',
        carats: carats, // Save as signed so we know if it is add or subtract
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

export async function updateManualAdjustment(id: number, data: {
  date: string | Date,
  carats: number, // signed: positive for add, negative for subtract
  remarks: string
}) {
  const { date, carats, remarks } = data
  if (carats === 0) throw new Error("Carats cannot be 0")
  if (!remarks) throw new Error("Remarks are required")

  await prisma.$transaction(async (tx) => {
    const oldEntry = await tx.stockLedger.findUnique({ where: { id } })
    if (!oldEntry || oldEntry.transactionType !== 'MANUAL_ADJUSTMENT') {
      throw new Error("Only manual adjustment entries can be edited.")
    }

    // Calculate stock difference
    // Treat the old entry as signed (which they are from our changes onwards;
    // for older entries, since they were positive opening stocks, this holds true).
    const oldSignedCarats = oldEntry.carats;
    const diff = carats - oldSignedCarats;

    await tx.stockLedger.update({
      where: { id },
      data: {
        date: new Date(date),
        carats: carats,
        remarks
      }
    })

    await tx.stock.upsert({
      where: { diamondType: oldEntry.diamondType },
      update: { totalCarats: { increment: diff } },
      create: { id: oldEntry.diamondType, diamondType: oldEntry.diamondType, totalCarats: carats }
    })
  })

  revalidatePath('/stock')
}

export async function deleteManualAdjustment(id: number) {
  await prisma.$transaction(async (tx) => {
    const oldEntry = await tx.stockLedger.findUnique({ where: { id } })
    if (!oldEntry || oldEntry.transactionType !== 'MANUAL_ADJUSTMENT') {
      throw new Error("Only manual adjustment entries can be deleted.")
    }

    // Revert stock change (subtract the old adjustment from Stock)
    await tx.stock.update({
      where: { diamondType: oldEntry.diamondType },
      data: { totalCarats: { decrement: oldEntry.carats } }
    })

    // Delete the ledger entry
    await tx.stockLedger.delete({ where: { id } })
  })

  revalidatePath('/stock')
}
