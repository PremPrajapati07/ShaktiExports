'use client'

import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { Eye, Download, Pencil } from 'lucide-react'
import Link from 'next/link'
import { generateInvoicePDF } from '@/lib/pdf-generator'
import { DeleteInvoiceButton } from './DeleteButtons'

export function InvoiceList({ invoices }: { invoices: any[] }) {
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

  const handleDownloadPDF = (invoice: any) => {
    const doc = generateInvoicePDF(invoice)
    doc.save(`${invoice.invoiceNo.replace(/\//g, '_')}.pdf`)
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
      'Billed To Party',
      'Billed To GSTIN',
      'Billed To State',
      'Billed To State Code',
      'Shipped To Party',
      'Shipped To GSTIN',
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
      `"${inv.billedTo?.name || ''}"`,
      `"${inv.billedTo?.gstin || ''}"`,
      `"${inv.billedTo?.state || ''}"`,
      `"${inv.billedTo?.stateCode || ''}"`,
      `"${inv.shippedTo?.name || inv.billedTo?.name || ''}"`,
      `"${inv.shippedTo?.gstin || inv.billedTo?.gstin || ''}"`,
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
    link.setAttribute('download', `Sell_Invoices_Export_${format(new Date(), 'yyyyMMdd')}.csv`)
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
            <th>Party Name</th>
            <th>Type</th>
            <th>Total Value</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.map((inv) => (
            <tr key={inv.id}>
              <td className="font-bold mono">{inv.invoiceNo}</td>
              <td>{format(new Date(inv.date), 'dd/MM/yyyy')}</td>
              <td>{inv.billedTo?.name}</td>
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
                  <Link href={`/invoices/edit/${inv.id}`} className="action-btn edit" title="Edit">
                    <Pencil size={16} />
                  </Link>
                  <button 
                    onClick={() => handleDownloadPDF(inv)} 
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
          {filteredInvoices.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No invoices found for the selected date range.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
