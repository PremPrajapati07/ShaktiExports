import { PurchaseInvoiceForm } from '@/components/PurchaseInvoiceForm'
import { notFound } from 'next/navigation'
import { getPurchaseInvoice } from '@/lib/actions/purchase-invoices'
import { getSuppliers } from '@/lib/actions/purchase-parties'
import { prisma } from '@/lib/prisma'

export default async function EditPurchaseInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoiceId = parseInt(id)

  const [invoice, suppliers, companyBuyer] = await Promise.all([
    getPurchaseInvoice(invoiceId),
    getSuppliers(),
    prisma.purchaseBuyer.findFirst({ where: { isCompany: true } })
  ])

  if (!invoice) notFound()
  if (!companyBuyer) notFound()

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Edit Purchase Invoice: {invoice.invoiceNo}</h1>
          <p className="subtitle">Update recorded diamond purchase details</p>
        </div>
      </header>
      <PurchaseInvoiceForm
        suppliers={suppliers}
        companyBuyer={companyBuyer}
        initialData={invoice}
        invoiceId={invoiceId}
      />
    </div>
  )
}
