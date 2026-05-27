'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/lib/auth'
import { createAuditLog } from './logs'

export async function getInvoices() {
  return await prisma.invoice.findMany({
    include: {
      billedTo: true,
      shippedTo: true,
      lineItems: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getInvoice(id: number) {
  return await prisma.invoice.findUnique({
    where: { id },
    include: {
      billedTo: true,
      shippedTo: true,
      lineItems: true
    }
  })
}

export async function deleteInvoice(id: number) {
  const user = await getAuthSession()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can delete invoices.')
  }

  await prisma.$transaction(async (tx) => {
    const oldInvoice = await tx.invoice.findUnique({
      where: { id },
      include: { lineItems: true }
    })
    
    if (oldInvoice) {
      const totalCarats = oldInvoice.lineItems.reduce((sum, item) => sum + item.quantity, 0)
      
      // Reverse stock (add back)
      await tx.stock.update({
        where: { diamondType: oldInvoice.diamondType },
        data: { totalCarats: { increment: totalCarats } }
      })

      // Delete ledger entry
      await tx.stockLedger.deleteMany({
        where: { referenceId: id, transactionType: 'SELL' }
      })

      // Log the deletion
      await createAuditLog(
        'DELETE',
        'INVOICE',
        id.toString(),
        `Deleted invoice no ${oldInvoice.invoiceNo} (value: ₹${oldInvoice.totalValue.toLocaleString()})`
      )
    }

    await tx.invoice.delete({
      where: { id }
    })
  })
  
  revalidatePath('/invoices')
  revalidatePath('/stock')
  revalidatePath('/')
}

export async function generateInvoiceNumber(
  type: 'Intra' | 'Inter',
  diamondType: 'LabGrown' | 'Natural',
  date: Date
) {
  const year = getFinancialYear(date)
  // LGD for Lab Grown, NS for Natural Diamond
  const prefix = diamondType === 'LabGrown' ? 'LGD' : 'NS'
  const counterId = `Sell-${type}-${prefix}`

  const result = await prisma.$transaction(async (tx: any) => {
    let counter = await tx.counter.findUnique({ where: { id: counterId } })

    if (!counter || counter.year !== year) {
      counter = await tx.counter.upsert({
        where: { id: counterId },
        update: { lastNumber: 1, year },
        create: { id: counterId, lastNumber: 1, year }
      })
    } else {
      counter = await tx.counter.update({
        where: { id: counterId },
        data: { lastNumber: { increment: 1 } }
      })
    }

    return counter
  })

  const num = result.lastNumber.toString().padStart(3, '0')
  return `${prefix}/${num}/${year}`
}

function getFinancialYear(date: Date) {
  const d = new Date(date)
  const month = d.getMonth() // 0-indexed
  const year = d.getFullYear()
  
  let startYear, endYear
  if (month >= 3) { // April onwards
    startYear = year
    endYear = year + 1
  } else {
    startYear = year - 1
    endYear = year
  }
  
  return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`
}

export async function createInvoice(data: any) {
  const user = await getAuthSession()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // 1. Generate Invoice Number
  const invoiceNo = await generateInvoiceNumber(data.type, data.diamondType, new Date(data.date))
  
  // 2. Create the invoice inside a transaction to maintain stock sync
  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.invoice.create({
      data: {
        invoiceNo,
        date: new Date(data.date),
        type: data.type,
        diamondType: data.diamondType,
        billedToId: data.billedToId,
        shippedToId: data.shippedToId === -1 ? data.billedToId : data.shippedToId,
        gstin: data.gstin,
        pan: data.pan,
        terms: data.terms,
        banker: data.banker,
        accountNo: data.accountNo,
        ifsc: data.ifsc,
        districtOriginCode: data.districtOriginCode,
        taxableAmount: data.taxableAmount,
        cgstTotal: data.cgstTotal || 0,
        sgstTotal: data.sgstTotal || 0,
        igstTotal: data.igstTotal || 0,
        totalTax: data.totalTax,
        amountAfterTax: data.amountAfterTax,
        roundOff: data.roundOff,
        totalValue: data.totalValue,
        totalWords: data.totalWords,
        declarationText: data.declarationText,
        lineItems: {
          create: data.lineItems.map((item: any) => ({
            description: item.description,
            hsn: item.hsn,
            quantity: item.quantity,
            rate: item.rate,
            discount: item.discount || 0,
            taxableValue: item.taxableValue,
            cgstRate: item.cgstRate || 0,
            cgstAmount: item.cgstAmount || 0,
            sgstRate: item.sgstRate || 0,
            sgstAmount: item.sgstAmount || 0,
            igstRate: item.igstRate || 0,
            igstAmount: item.igstAmount || 0,
            total: item.total
          }))
        }
      }
    })

    const totalCarats = data.lineItems.reduce((sum: number, item: any) => sum + Number(item.quantity), 0)
    const billedToParty = await tx.party.findUnique({ where: { id: data.billedToId } })

    await tx.stockLedger.create({
      data: {
        diamondType: data.diamondType,
        date: new Date(data.date),
        transactionType: 'SELL',
        carats: totalCarats,
        referenceId: inv.id,
        referenceNo: inv.invoiceNo,
        partyId: billedToParty?.id,
        partyName: billedToParty?.name,
        partyType: 'BUYER'
      }
    })

    await tx.stock.upsert({
      where: { diamondType: data.diamondType },
      update: { totalCarats: { decrement: totalCarats } },
      create: { id: data.diamondType, diamondType: data.diamondType, totalCarats: -totalCarats }
    })

    return inv
  })
  
  await createAuditLog(
    'CREATE',
    'INVOICE',
    invoice.id.toString(),
    `Created invoice no ${invoice.invoiceNo} for party id ${invoice.billedToId} (value: ₹${invoice.totalValue.toLocaleString()})`
  )

  revalidatePath('/', 'layout')
  revalidatePath('/invoices')
  revalidatePath('/stock')
  return invoice
}

export async function updateInvoice(id: number, data: any) {
  const user = await getAuthSession()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const invoice = await prisma.$transaction(async (tx) => {
    // Revert old stock
    const oldInvoice = await tx.invoice.findUnique({ where: { id }, include: { lineItems: true } })
    if (oldInvoice) {
      const oldTotalCarats = oldInvoice.lineItems.reduce((sum, item) => sum + item.quantity, 0)
      await tx.stock.update({
        where: { diamondType: oldInvoice.diamondType },
        data: { totalCarats: { increment: oldTotalCarats } }
      })
      await tx.stockLedger.deleteMany({
        where: { referenceId: id, transactionType: 'SELL' }
      })
    }

    const inv = await tx.invoice.update({
      where: { id },
      data: {
        date: new Date(data.date),
        type: data.type,
        diamondType: data.diamondType,
        billedToId: data.billedToId,
        shippedToId: data.shippedToId === -1 ? data.billedToId : data.shippedToId,
        gstin: data.gstin,
        pan: data.pan,
        terms: data.terms,
        banker: data.banker,
        accountNo: data.accountNo,
        ifsc: data.ifsc,
        districtOriginCode: data.districtOriginCode,
        taxableAmount: data.taxableAmount,
        cgstTotal: data.cgstTotal || 0,
        sgstTotal: data.sgstTotal || 0,
        igstTotal: data.igstTotal || 0,
        totalTax: data.totalTax,
        amountAfterTax: data.amountAfterTax,
        roundOff: data.roundOff,
        totalValue: data.totalValue,
        totalWords: data.totalWords,
        declarationText: data.declarationText,
        lineItems: {
          deleteMany: {},
          create: data.lineItems.map((item: any) => ({
            description: item.description,
            hsn: item.hsn,
            quantity: item.quantity,
            rate: item.rate,
            discount: item.discount || 0,
            taxableValue: item.taxableValue,
            cgstRate: item.cgstRate || 0,
            cgstAmount: item.cgstAmount || 0,
            sgstRate: item.sgstRate || 0,
            sgstAmount: item.sgstAmount || 0,
            igstRate: item.igstRate || 0,
            igstAmount: item.igstAmount || 0,
            total: item.total
          }))
        }
      }
    })

    const newTotalCarats = data.lineItems.reduce((sum: number, item: any) => sum + Number(item.quantity), 0)
    const billedToParty = await tx.party.findUnique({ where: { id: data.billedToId } })

    await tx.stockLedger.create({
      data: {
        diamondType: data.diamondType,
        date: new Date(data.date),
        transactionType: 'SELL',
        carats: newTotalCarats,
        referenceId: inv.id,
        referenceNo: inv.invoiceNo,
        partyId: billedToParty?.id,
        partyName: billedToParty?.name,
        partyType: 'BUYER'
      }
    })

    await tx.stock.upsert({
      where: { diamondType: data.diamondType },
      update: { totalCarats: { decrement: newTotalCarats } },
      create: { id: data.diamondType, diamondType: data.diamondType, totalCarats: -newTotalCarats }
    })

    return inv
  })

  await createAuditLog(
    'EDIT',
    'INVOICE',
    invoice.id.toString(),
    `Updated invoice no ${invoice.invoiceNo} (value: ₹${invoice.totalValue.toLocaleString()})`
  )

  revalidatePath('/', 'layout')
  revalidatePath('/invoices')
  revalidatePath('/stock')
  return invoice
}

