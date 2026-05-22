import { getPurchaseInvoice } from '@/lib/actions/purchase-invoices'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ChevronLeft, Pencil } from 'lucide-react'

export default async function PurchaseInvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getPurchaseInvoice(parseInt(id))
  if (!invoice) notFound()

  const isIGST = invoice.type === 'Intra'

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>{invoice.invoiceNo}</h1>
          <p className="subtitle">
            Purchase Invoice · {format(new Date(invoice.date), 'dd MMM yyyy')} ·{' '}
            {isIGST ? 'IGST (Intra)' : 'CGST+SGST (Inter)'} ·{' '}
            {invoice.diamondType === 'LabGrown' ? 'Lab Grown' : 'Natural Diamond'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/purchase-invoices" className="btn btn-outline">
            <ChevronLeft size={20} /> Back
          </Link>
          <Link href={`/purchase-invoices/edit/${invoice.id}`} className="btn btn-primary">
            <Pencil size={18} /> Edit
          </Link>
        </div>
      </header>


      <div className="glass-card" style={{ padding: '2rem' }}>
        {/* Supplier + Ship To + Bill To */}
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier (From Whom)</h3>
            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{invoice.supplier.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{invoice.supplier.address}, {invoice.supplier.city}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>GSTIN: {invoice.supplier.gstin}</p>
          </div>
          <div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Consignee (Ship To)</h3>
            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{invoice.shipTo.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{invoice.shipTo.address}, {invoice.shipTo.city}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>GSTIN: {invoice.shipTo.gstin}</p>
          </div>
          <div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buyer (Bill To)</h3>
            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{invoice.billTo.name}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{invoice.billTo.address}, {invoice.billTo.city}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>GSTIN: {invoice.billTo.gstin}</p>
          </div>
        </div>


        {/* Line items */}
        <table className="data-table" style={{ marginBottom: '1.5rem' }}>
          <thead>
            <tr>
              <th>Description</th>
              <th>HSN</th>
              <th>Qty (Cts)</th>
              <th>Rate</th>
              <th style={{ textAlign: 'right' }}>Taxable Value</th>
              {isIGST ? <th style={{ textAlign: 'right' }}>IGST</th> : <><th style={{ textAlign: 'right' }}>CGST</th><th style={{ textAlign: 'right' }}>SGST</th></>}
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item: any) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>{item.hsn}</td>
                <td>{item.quantity}</td>
                <td>₹{item.rate.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>₹{item.taxableValue.toFixed(2)}</td>
                {isIGST
                  ? <td style={{ textAlign: 'right' }}>₹{item.igstAmount.toFixed(2)} ({item.igstRate}%)</td>
                  : <>
                    <td style={{ textAlign: 'right' }}>₹{item.cgstAmount.toFixed(2)} ({item.cgstRate}%)</td>
                    <td style={{ textAlign: 'right' }}>₹{item.sgstAmount.toFixed(2)} ({item.sgstRate}%)</td>
                  </>
                }
                <td style={{ textAlign: 'right' }}>₹{item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: '280px' }}>
            <div className="summary-row"><span>Taxable Amount:</span><span>₹{invoice.taxableAmount.toFixed(2)}</span></div>
            {isIGST ? <div className="summary-row"><span>IGST:</span><span>₹{invoice.igstTotal.toFixed(2)}</span></div>
              : <>
                <div className="summary-row"><span>CGST:</span><span>₹{invoice.cgstTotal.toFixed(2)}</span></div>
                <div className="summary-row"><span>SGST:</span><span>₹{invoice.sgstTotal.toFixed(2)}</span></div>
              </>
            }
            <div className="summary-row"><span>Round Off:</span><span>₹{invoice.roundOff.toFixed(2)}</span></div>
            <div className="summary-row total"><span>Total Value:</span><span>₹{invoice.totalValue.toLocaleString()}</span></div>
            <div className="words-block" style={{ marginTop: '0.5rem' }}>
              <p className="form-label">Amount in Words</p>
              <p className="words-text">{invoice.totalWords}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
