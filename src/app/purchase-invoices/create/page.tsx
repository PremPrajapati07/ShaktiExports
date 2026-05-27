import { PurchaseInvoiceForm } from '@/components/PurchaseInvoiceForm'
import { getSuppliers } from '@/lib/actions/purchase-parties'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function CreatePurchaseInvoicePage() {
  const [suppliers, companyBuyer] = await Promise.all([
    getSuppliers(),
    prisma.purchaseBuyer.findFirst({ where: { isCompany: true } })
  ])

  if (!companyBuyer) notFound()

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
        companyBuyer={companyBuyer}
      />
    </div>
  )
}
