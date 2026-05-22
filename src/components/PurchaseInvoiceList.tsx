'use client'

import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { Eye, Pencil, Trash2, Download } from 'lucide-react'
import Link from 'next/link'
import { deletePurchaseInvoice } from '@/lib/actions/purchase-invoices'

export function PurchaseInvoiceList({ invoices }: { invoices: any[] }) {
  const [filterType, setFilterType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const getFilteredInvoices = () => {
    return invoices.filter(inv => {
      const invDate = new Date(inv.date || inv.createdAt)
      const now = new Date()

      if (filterType === 'all') return true
      if (filterType === 'last_month') {
        const cutoff = subMonths(now, 1)
        return invDate >= cutoff && invDate <= now
      }
      if (filterType === 'last_3_months') {
        const cutoff = subMonths(now, 3)
        return invDate >= cutoff && invDate <= now
      }
      if (filterType === 'last_5_months') {
        const cutoff = subMonths(now, 5)
        return invDate >= cutoff && invDate <= now
      }
      if (filterType === 'custom') {
        if (!startDate && !endDate) return true
        if (startDate && endDate) {
          return invDate >= new Date(startDate) && invDate <= new Date(endDate)
        }
        if (startDate) return invDate >= new Date(startDate)
        if (endDate) return invDate <= new Date(endDate)
      }
      return true
    })
  }

  const handleExportCSV = () => {
    const filtered = getFilteredInvoices()
    if (filtered.length === 0) {
      alert('No invoices to export')
      return
    }

    const headers = [
      'Invoice No',
      'Invoice Date',
      'Supplier Name',
      'Supplier GSTIN',
      'Supplier State',
      'Supplier State Code',
      'Consignee (Ship To)',
      'Consignee GSTIN',
      'Buyer (Bill To)',
      'Buyer GSTIN',
      'Diamond Type',
      'Taxable Amount',
      'CGST Amount',
      'SGST Amount',
      'IGST Amount',
      'Total Tax',
      'Total Value'
    ]

    const rows = filtered.map(inv => [
      `"${inv.invoiceNo}"`,
      `"${format(new Date(inv.date || inv.createdAt), 'yyyy-MM-dd')}"`,
      `"${inv.supplier?.name || ''}"`,
      `"${inv.supplier?.gstin || inv.sellerGstin || ''}"`,
      `"${inv.supplier?.state || ''}"`,
      `"${inv.supplier?.stateCode || ''}"`,
      `"${inv.shipTo?.name || ''}"`,
      `"${inv.shipTo?.gstin || ''}"`,
      `"${inv.billTo?.name || ''}"`,
      `"${inv.billTo?.gstin || ''}"`,
      `"${inv.diamondType === 'LabGrown' ? 'Lab Grown (CVD)' : 'Natural Diamond'}"`,
      inv.taxableAmount,
      inv.cgstTotal,
      inv.sgstTotal,
      inv.igstTotal,
      inv.totalTax,
      inv.totalValue
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Purchase_Invoices_Export_${format(new Date(), 'yyyyMMdd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredInvoices = getFilteredInvoices()

  return (
    <div>
      <div className="filter-bar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>Filter Date:</span>
          <select
            className="form-input"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: '200px', padding: '0.5rem 1rem', marginBottom: 0 }}
          >
            <option value="all">All Time</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_5_months">Last 5 Months</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {filterType === 'custom' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '0.5rem 1rem', marginBottom: 0 }}
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '0.5rem 1rem', marginBottom: 0 }}
              />
            </div>
          )}
        </div>

        <button onClick={handleExportCSV} className="btn btn-outline" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Download size={18} />
          <span>Export Filtered CSV</span>
        </button>
      </div>

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
          {filteredInvoices.map((inv: any) => (
            <PurchaseInvoiceRow key={inv.id} inv={inv} />
          ))}
          {filteredInvoices.length === 0 && (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No purchase invoices found for the selected date range.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function PurchaseInvoiceRow({ inv }: { inv: any }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this purchase invoice?')) return
    setDeleting(true)
    await deletePurchaseInvoice(inv.id)
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
          <Link href={`/purchase-invoices/view/${inv.id}`} className="icon-btn" title="View Details"><Eye size={16} /></Link>
          <Link href={`/purchase-invoices/edit/${inv.id}`} className="icon-btn" title="Edit Invoice"><Pencil size={16} /></Link>
          <button onClick={handleDelete} className="icon-btn danger" disabled={deleting} title="Delete Invoice"><Trash2 size={16} /></button>
        </div>
      </td>
    </tr>
  )
}
