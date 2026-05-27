'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getAuthSession } from '@/lib/auth'
import { createAuditLog } from './logs'

export async function getUnreconciledInvoices(partyId: number, isPurchase: boolean) {
  const user = await getAuthSession()
  if (!user) throw new Error('Unauthorized')

  if (!isPurchase) {
    // Sell Invoices (RECEIPT from customer)
    const invoices = await prisma.invoice.findMany({
      where: { billedToId: partyId },
      include: {
        allocations: true,
        billedTo: true
      },
      orderBy: { date: 'asc' }
    })

    return invoices
      .map(invoice => {
        const allocated = invoice.allocations.reduce((sum, a) => sum + a.amount, 0)
        const outstanding = Math.max(0, invoice.totalValue - allocated)
        return {
          id: invoice.id,
          invoiceNo: invoice.invoiceNo,
          date: invoice.date,
          totalValue: invoice.totalValue,
          allocated,
          outstanding
        }
      })
      .filter(inv => inv.outstanding > 0.01)
  } else {
    // Purchase Invoices (PAYMENT to supplier)
    const invoices = await prisma.purchaseInvoice.findMany({
      where: { supplierId: partyId },
      include: {
        allocations: true,
        supplier: true
      },
      orderBy: { date: 'asc' }
    })

    return invoices
      .map(invoice => {
        const allocated = invoice.allocations.reduce((sum, a) => sum + a.amount, 0)
        const outstanding = Math.max(0, invoice.totalValue - allocated)
        return {
          id: invoice.id,
          invoiceNo: invoice.invoiceNo,
          date: invoice.date,
          totalValue: invoice.totalValue,
          allocated,
          outstanding
        }
      })
      .filter(inv => inv.outstanding > 0.01)
  }
}

export async function getPaymentTransactions() {
  const user = await getAuthSession()
  if (!user) throw new Error('Unauthorized')

  return await prisma.paymentTransaction.findMany({
    include: {
      allocations: {
        include: {
          invoice: true,
          purchase: true
        }
      }
    },
    orderBy: { date: 'desc' }
  })
}

interface CreateTransactionData {
  date: Date
  type: 'RECEIPT' | 'PAYMENT'
  amount: number
  paymentMode: string
  referenceNo?: string
  remarks?: string
  partyId?: number
  supplierId?: number
  allocations: {
    invoiceId?: number
    purchaseId?: number
    amount: number
  }[]
}

export async function createPaymentTransaction(data: CreateTransactionData) {
  const user = await getAuthSession()
  if (!user) throw new Error('Unauthorized')
  if (!['ADMIN', 'ACCOUNTANT'].includes(user.role)) {
    throw new Error('Unauthorized: Only administrators and accountants can record payments.')
  }

  let partyName: string | undefined = undefined
  let supplierName: string | undefined = undefined

  if (data.partyId && data.type === 'RECEIPT') {
    const party = await prisma.party.findUnique({ where: { id: data.partyId } })
    if (party) partyName = party.name
  } else if (data.supplierId && data.type === 'PAYMENT') {
    const supplier = await prisma.purchaseSupplier.findUnique({ where: { id: data.supplierId } })
    if (supplier) supplierName = supplier.name
  }

  const transaction = await prisma.$transaction(async (tx) => {
    // 1. Create Transaction
    const txRecord = await tx.paymentTransaction.create({
      data: {
        date: new Date(data.date),
        type: data.type,
        amount: data.amount,
        paymentMode: data.paymentMode,
        referenceNo: data.referenceNo || null,
        remarks: data.remarks || null,
        partyId: data.partyId || null,
        partyName: partyName || null,
        supplierId: data.supplierId || null,
        supplierName: supplierName || null
      }
    })

    // 2. Create Allocations
    if (data.allocations && data.allocations.length > 0) {
      await tx.paymentAllocation.createMany({
        data: data.allocations.map(alloc => ({
          transactionId: txRecord.id,
          invoiceId: alloc.invoiceId || null,
          purchaseId: alloc.purchaseId || null,
          amount: alloc.amount
        }))
      })
    }

    return txRecord
  })

  // Log audit trail
  const targetName = data.type === 'RECEIPT' ? partyName : supplierName
  await createAuditLog(
    'CREATE',
    'RECONCILIATION',
    transaction.id.toString(),
    `Recorded ${data.type} of ₹${data.amount.toLocaleString()} for ${targetName}. Allocated to ${data.allocations.length} bills.`
  )

  revalidatePath('/reconciliation')
  revalidatePath('/parties')
  revalidatePath('/purchase-suppliers')
  return transaction
}

export async function deletePaymentTransaction(id: number) {
  const user = await getAuthSession()
  if (!user || user.role !== 'ADMIN') {
    throw new Error('Unauthorized: Only administrators can delete payment transactions.')
  }

  const txRecord = await prisma.paymentTransaction.findUnique({
    where: { id }
  })

  if (txRecord) {
    await prisma.$transaction(async (tx) => {
      // Cascade delete handles allocations since they have onDelete: Cascade
      await tx.paymentTransaction.delete({
        where: { id }
      })
    })

    const targetName = txRecord.type === 'RECEIPT' ? txRecord.partyName : txRecord.supplierName
    await createAuditLog(
      'DELETE',
      'RECONCILIATION',
      id.toString(),
      `Deleted ${txRecord.type} transaction of ₹${txRecord.amount.toLocaleString()} for ${targetName}`
    )
  }

  revalidatePath('/reconciliation')
  revalidatePath('/parties')
  revalidatePath('/purchase-suppliers')
}
