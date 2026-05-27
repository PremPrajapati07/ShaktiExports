'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/lib/auth'
import { createAuditLog } from './logs'

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


function getFinancialYear(date: Date) {
  const d = new Date(date)
  const month = d.getMonth()
  const year = d.getFullYear()
  const startYear = month >= 3 ? year : year - 1
  const endYear = startYear + 1
  return `${startYear.toString().slice(-2)}-${endYear.toString().slice(-2)}`
}

export async function deletePurchaseInvoice(id: number) {
  const user = await getAuthSession()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can delete purchase invoices.')
  }

  await prisma.$transaction(async (tx) => {
    const oldInvoice = await tx.purchaseInvoice.findUnique({
      where: { id },
      include: { lineItems: true }
    })
    
    if (oldInvoice) {
      const totalCarats = oldInvoice.lineItems.reduce((sum, item) => sum + item.quantity, 0)
      
      // Reverse stock (subtract back)
      await tx.stock.update({
        where: { diamondType: oldInvoice.diamondType },
        data: { totalCarats: { decrement: totalCarats } }
      })

      // Delete ledger entry
      await tx.stockLedger.deleteMany({
        where: { referenceId: id, transactionType: 'PURCHASE' }
      })

      // Log the deletion
      await createAuditLog(
        'DELETE',
        'PURCHASE_INVOICE',
        id.toString(),
        `Deleted purchase invoice no ${oldInvoice.invoiceNo} (value: ₹${oldInvoice.totalValue.toLocaleString()})`
      )
    }

    await tx.purchaseInvoice.delete({
      where: { id }
    })
  })
  revalidatePath('/purchase-invoices')
  revalidatePath('/stock')
  revalidatePath('/')
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
  const user = await getAuthSession()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const invoiceNo = await generatePurchaseInvoiceNumber(
    data.type, data.diamondType, new Date(data.date)
  )

  const invoice = await prisma.$transaction(async (tx) => {
    const inv = await tx.purchaseInvoice.create({
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

    const totalCarats = data.lineItems.reduce((sum: number, item: any) => sum + Number(item.quantity), 0)
    const supplier = await tx.purchaseSupplier.findUnique({ where: { id: data.supplierId } })

    await tx.stockLedger.create({
      data: {
        diamondType: data.diamondType,
        date: new Date(data.date),
        transactionType: 'PURCHASE',
        carats: totalCarats,
        referenceId: inv.id,
        referenceNo: inv.invoiceNo,
        partyId: supplier?.id,
        partyName: supplier?.name,
        partyType: 'SUPPLIER'
      }
    })

    await tx.stock.upsert({
      where: { diamondType: data.diamondType },
      update: { totalCarats: { increment: totalCarats } },
      create: { id: data.diamondType, diamondType: data.diamondType, totalCarats: totalCarats }
    })

    return inv
  })

  await createAuditLog(
    'CREATE',
    'PURCHASE_INVOICE',
    invoice.id.toString(),
    `Created purchase invoice no ${invoice.invoiceNo} from supplier id ${invoice.supplierId} (value: ₹${invoice.totalValue.toLocaleString()})`
  )

  revalidatePath('/', 'layout')
  revalidatePath('/purchase-invoices')
  revalidatePath('/stock')
  return invoice
}

export async function updatePurchaseInvoice(id: number, data: any) {
  const user = await getAuthSession()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const invoice = await prisma.$transaction(async (tx) => {
    // Revert old stock
    const oldInvoice = await tx.purchaseInvoice.findUnique({ where: { id }, include: { lineItems: true } })
    if (oldInvoice) {
      const oldTotalCarats = oldInvoice.lineItems.reduce((sum, item) => sum + item.quantity, 0)
      await tx.stock.update({
        where: { diamondType: oldInvoice.diamondType },
        data: { totalCarats: { decrement: oldTotalCarats } }
      })
      await tx.stockLedger.deleteMany({
        where: { referenceId: id, transactionType: 'PURCHASE' }
      })
    }

    const inv = await tx.purchaseInvoice.update({
      where: { id },
      data: {
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
    const supplier = await tx.purchaseSupplier.findUnique({ where: { id: data.supplierId } })

    await tx.stockLedger.create({
      data: {
        diamondType: data.diamondType,
        date: new Date(data.date),
        transactionType: 'PURCHASE',
        carats: newTotalCarats,
        referenceId: inv.id,
        referenceNo: inv.invoiceNo,
        partyId: supplier?.id,
        partyName: supplier?.name,
        partyType: 'SUPPLIER'
      }
    })

    await tx.stock.upsert({
      where: { diamondType: data.diamondType },
      update: { totalCarats: { increment: newTotalCarats } },
      create: { id: data.diamondType, diamondType: data.diamondType, totalCarats: newTotalCarats }
    })

    return inv
  })

  await createAuditLog(
    'EDIT',
    'PURCHASE_INVOICE',
    invoice.id.toString(),
    `Updated purchase invoice no ${invoice.invoiceNo} (value: ₹${invoice.totalValue.toLocaleString()})`
  )

  revalidatePath('/', 'layout')
  revalidatePath('/purchase-invoices')
  revalidatePath('/stock')
  return invoice
}
