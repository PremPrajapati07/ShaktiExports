'use client'

import { format } from 'date-fns'
import { Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { deletePurchaseInvoice } from '@/lib/actions/purchase-invoices'
import { generatePurchaseInvoicePDF } from '@/lib/purchase-pdf-generator'
import { useState } from 'react'

export function PurchaseInvoiceList({ invoices }: { invoices: any[] }) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Invoice No</th>
          <th>Date</th>
          <th>Supplier</th>
          <th>Consignee (Ship To)</th>
          <th>Buyer (Bill To)</th>
          <th>Type</th>
          <th>Diamond</th>
          <th style={{ textAlign: 'right' }}>Total Value</th>
          <th style={{ width: '120px' }}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((inv: any) => (
          <PurchaseInvoiceRow key={inv.id} inv={inv} />
        ))}
      </tbody>
    </table>
  )
}

function PurchaseInvoiceRow({ inv }: { inv: any }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this purchase invoice?')) return
    setDeleting(true)
    await deletePurchaseInvoice(inv.id)
  }

  const handleDownload = () => {
    const doc = generatePurchaseInvoicePDF(inv)
    doc.save(`purchase-${inv.invoiceNo.replace(/\//g, '-')}.pdf`)
  }

  return (
    <tr style={{ opacity: deleting ? 0.5 : 1 }}>
      <td className="mono"><strong>{inv.invoiceNo}</strong></td>
      <td>{format(new Date(inv.date), 'dd MMM yyyy')}</td>
      <td>{inv.supplier?.name}</td>
      <td>{inv.shipTo?.name}</td>
      <td>{inv.billTo?.name}</td>
      <td>
        <span className={`badge ${inv.type === 'Intra' ? 'badge-blue' : 'badge-green'}`}>
          {inv.type === 'Intra' ? 'Intra (IGST)' : 'Inter (CGST+SGST)'}
        </span>
      </td>
      <td>{inv.diamondType === 'LabGrown' ? 'Lab Grown' : 'Natural'}</td>
      <td style={{ textAlign: 'right' }}>₹{inv.totalValue.toLocaleString()}</td>
      <td>
        <div className="action-btns">
          <Link href={`/purchase-invoices/view/${inv.id}`} className="icon-btn"><Eye size={16} /></Link>
          <button onClick={handleDownload} className="icon-btn" title="Download PDF">↓</button>
          <button onClick={handleDelete} className="icon-btn danger" disabled={deleting}><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  )
}

