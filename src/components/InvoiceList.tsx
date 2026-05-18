'use client'

import { format } from 'date-fns'
import { Eye, Download } from 'lucide-react'
import Link from 'next/link'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { DeleteInvoiceButton } from './DeleteButtons'

export function InvoiceList({ invoices }: { invoices: any[] }) {
  const handleDownload = (invoice: any) => {
    const doc = generateInvoicePDF(invoice)
    doc.save(`${invoice.invoiceNo.replace(/\//g, '_')}.pdf`)
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Invoice No</th>
          <th>Date</th>
          <th>Party Name</th>
          <th>Type</th>
          <th>Total Value</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((inv) => (
          <tr key={inv.id}>
            <td className="font-bold mono">{inv.invoiceNo}</td>
            <td>{format(new Date(inv.date), 'dd/MM/yyyy')}</td>
            <td>{inv.billedTo.name}</td>
            <td>
              <span className={`type-badge ${inv.type.toLowerCase()}`}>
                {inv.type}
              </span>
            </td>
            <td className="font-bold">₹{inv.totalValue.toLocaleString()}</td>
            <td>
              <div className="actions">
                <Link href={`/invoices/view/${inv.id}`} className="action-btn view" title="View">
                  <Eye size={16} />
                </Link>
                <button 
                  onClick={() => handleDownload(inv)} 
                  className="action-btn download" 
                  title="Download PDF"
                >
                  <Download size={16} />
                </button>
                <DeleteInvoiceButton id={inv.id} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
