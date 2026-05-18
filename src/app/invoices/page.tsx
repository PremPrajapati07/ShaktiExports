import { getInvoices } from '@/lib/actions/invoices'
export const dynamic = 'force-dynamic'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { InvoiceList } from '@/components/InvoiceList'

export default async function InvoicesPage() {
  const invoices = await getInvoices()

  return (
    <div className="invoices-page animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Invoice List</h1>
          <p className="subtitle">History of all generated invoices</p>
        </div>
        <Link href="/invoices/create" className="btn btn-primary">
          <Plus size={20} />
          <span>Create Invoice</span>
        </Link>
      </header>

      <div className="glass-card table-container">
        {invoices.length === 0 ? (
          <div className="empty-state">
            <p>No invoices found. Start by creating your first invoice.</p>
          </div>
        ) : (
          <InvoiceList invoices={invoices} />
        )}
      </div>

    </div>
  )
}
