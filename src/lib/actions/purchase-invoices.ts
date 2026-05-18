'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getPurchaseInvoices() {
  return await prisma.purchaseInvoice.findMany({
    include: { supplier: true, shipTo: true, billTo: true, lineItems: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getPurchaseInvoice(id: number) {
  return await prisma.purchaseInvoice.findUnique({
    where: { id },
    include: { supplier: true, shipTo: true, billTo: true, lineItems: true }
  })
}

export async function deletePurchaseInvoice(id: number) {
  await prisma.purchaseInvoice.delete({ where: { id } })
  revalidatePath('/purchase-invoices')
}

function getFinancialYear(date: Date) {
  const d = new Date(date)
  const month = d.getMonth()
  const year = d.getFullYear()
  const startYear = month >= 3 ? year : year - 1
  const endYear = startYear + 1
  return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`
}

export async function generatePurchaseInvoiceNumber(
  type: 'Intra' | 'Inter',
  diamondType: 'LabGrown' | 'Natural',
  date: Date
) {
  const year = getFinancialYear(date)
  // LGD for LabGrown, NS for Natural
  const prefix = diamondType === 'LabGrown' ? 'LGD' : 'NS'
  const counterId = `Buy-${type}-${prefix}`

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
  return `P-${prefix}/${num}/${year}`
}

export async function createPurchaseInvoice(data: any) {
  const invoiceNo = await generatePurchaseInvoiceNumber(
    data.type, data.diamondType, new Date(data.date)
  )

  const invoice = await prisma.purchaseInvoice.create({
    data: {
      invoiceNo,
      date: new Date(data.date),
      type: data.type,
      diamondType: data.diamondType,
      supplierId: data.supplierId,
      shipToId: data.shipToId,
      billToId: data.billToId,
      sellerGstin: data.sellerGstin,
      sellerPan: data.sellerPan,
      terms: data.terms,
      bankerName: data.bankerName,
      accountNo: data.accountNo,
      ifsc: data.ifsc,
      swiftCode: data.swiftCode,
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

  revalidatePath('/', 'layout')
  return invoice
}

