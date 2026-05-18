export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { PurchaseInvoiceForm } from '@/components/PurchaseInvoiceForm'

export default async function CreatePurchaseInvoicePage() {
  const [suppliers, buyers, declarations] = await Promise.all([
    prisma.purchaseSupplier.findMany({ orderBy: { name: 'asc' } }),
    prisma.purchaseBuyer.findMany({ orderBy: { name: 'asc' } }),
    prisma.declaration.findMany({ orderBy: { title: 'asc' } })
  ])

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Create Purchase Invoice</h1>
          <p className="subtitle">Record a diamond purchase with full GST details</p>
        </div>
      </header>
      <PurchaseInvoiceForm
        suppliers={suppliers}
        buyers={buyers}
        declarations={declarations}
      />
    </div>
  )
}
