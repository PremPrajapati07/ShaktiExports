export const dynamic = 'force-dynamic'

import { getPurchaseInvoices } from '@/lib/actions/purchase-invoices'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { PurchaseInvoiceList } from '@/components/PurchaseInvoiceList'

export default async function PurchaseInvoicesPage() {
  const invoices = await getPurchaseInvoices()

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Purchase Invoices</h1>
          <p className="subtitle">{invoices.length} total purchase invoices</p>
        </div>
        <Link href="/purchase-invoices/create" className="btn btn-primary">
          <Plus size={20} /> New Purchase Invoice
        </Link>
      </header>

      <div className="glass-card table-container">
        {invoices.length === 0 ? (
          <div className="empty-state">
            <p>No purchase invoices yet.</p>
          </div>
        ) : (
          <PurchaseInvoiceList invoices={invoices} />
        )}
      </div>
    </div>
  )
}
