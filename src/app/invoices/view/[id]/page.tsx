import { getInvoice } from '@/lib/actions/invoices'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { Download, ChevronLeft, Printer } from 'lucide-react'
import Link from 'next/link'
import { PDFDownloadButton } from '@/components/PDFButtons'

export default async function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const invoice = await getInvoice(parseInt(id))

  if (!invoice) {
    notFound()
  }

  return (
    <div className="invoice-view animate-fade-in">
      <header className="page-header">
        <div className="header-left">
          <Link href="/invoices" className="btn btn-outline btn-sm mb-2">
            <ChevronLeft size={16} /> Back to List
          </Link>
          <h1>Invoice {invoice.invoiceNo}</h1>
          <p className="subtitle">Generated on {format(new Date(invoice.date), 'PPP')}</p>
        </div>
        <div className="header-actions">
          <PDFDownloadButton invoice={invoice} />
        </div>
      </header>

      <div className="invoice-preview glass-card">
        {/* Simple Web Preview of the Invoice */}
        <div className="preview-header">
          <div className="company-info">
            <h2>SHAKTI EXPORTS</h2>
            <p>Cut & Polished Diamonds</p>
          </div>
          <div className="invoice-meta">
            <div className="meta-row"><span>Invoice No:</span> <strong>{invoice.invoiceNo}</strong></div>
            <div className="meta-row"><span>Date:</span> <strong>{format(new Date(invoice.date), 'dd/MM/yyyy')}</strong></div>
            <div className="meta-row"><span>Type:</span> <strong>{invoice.type}</strong></div>
          </div>
        </div>

        <div className="parties-grid">
          <div className="party-box">
            <h3>Billed To:</h3>
            <p className="party-name">{invoice.billedTo.name}</p>
            <p className="party-address">{invoice.billedTo.address}</p>
            <p>{invoice.billedTo.city}, {invoice.billedTo.state}</p>
            <p>GSTIN: {invoice.billedTo.gstin}</p>
          </div>
          <div className="party-box">
            <h3>Shipped To:</h3>
            <p className="party-name">{invoice.shippedTo.name}</p>
            <p className="party-address">{invoice.shippedTo.address}</p>
            <p>{invoice.shippedTo.city}, {invoice.shippedTo.state}</p>
            <p>GSTIN: {invoice.shippedTo.gstin}</p>
          </div>
        </div>

        <table className="preview-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>HSN</th>
              <th>Quantity</th>
              <th>Rate</th>
              {invoice.type === 'Inter' && <th>Discount</th>}
              <th>Taxable</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lineItems.map((item: any) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>{item.hsn}</td>
                <td>{item.quantity}</td>
                <td>₹{item.rate.toLocaleString()}</td>
                {invoice.type === 'Inter' && <td>₹{item.discount.toLocaleString()}</td>}
                <td>₹{item.taxableValue.toLocaleString()}</td>
                <td className="font-bold">₹{item.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="summary-section">
          <div className="declaration-part">
            <h3>Declaration:</h3>
            <p>{invoice.declarationText}</p>
          </div>
          <div className="totals-part">
            <div className="total-row"><span>Taxable Amount:</span> <span>₹{invoice.taxableAmount.toLocaleString()}</span></div>
            {invoice.type === 'Intra' ? (
              <>
                <div className="total-row"><span>CGST:</span> <span>₹{invoice.cgstTotal.toLocaleString()}</span></div>
                <div className="total-row"><span>SGST:</span> <span>₹{invoice.sgstTotal.toLocaleString()}</span></div>
              </>
            ) : (
              <div className="total-row"><span>IGST:</span> <span>₹{invoice.igstTotal.toLocaleString()}</span></div>
            )}
            <div className="total-row grand"><span>Total Value:</span> <span>₹{invoice.totalValue.toLocaleString()}</span></div>
          </div>
        </div>
      </div>

    </div>
  )
}
