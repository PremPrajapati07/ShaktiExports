'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

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
  await prisma.invoice.delete({
    where: { id }
  })
  revalidatePath('/invoices')
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
  // 1. Generate Invoice Number
  const invoiceNo = await generateInvoiceNumber(data.type, data.diamondType, new Date(data.date))
  
  // 2. Create the invoice
  const invoice = await prisma.invoice.create({
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
  
  revalidatePath('/', 'layout')
  return invoice
}
