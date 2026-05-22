'use client'

import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { Download } from 'lucide-react'

export function DashboardExport({ sellInvoices, purchaseInvoices }: { sellInvoices: any[], purchaseInvoices: any[] }) {
  const [filterType, setFilterType] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleExportCombinedCSV = () => {
    const filterFn = (inv: any) => {
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
    }

    const filteredSell = sellInvoices.filter(filterFn)
    const filteredPurchase = purchaseInvoices.filter(filterFn)

    if (filteredSell.length === 0 && filteredPurchase.length === 0) {
      alert('No invoices found in this date range to export')
      return
    }

    const headers = [
      'Transaction Type',
      'Invoice No',
      'Invoice Date',
      'Party Name / Supplier',
      'Party GSTIN',
      'Party State',
      'Party State Code',
      'Diamond Type',
      'Taxable Amount',
      'CGST Amount',
      'SGST Amount',
      'IGST Amount',
      'Total Tax',
      'Total Value'
    ]

    const sellRows = filteredSell.map(inv => [
      '"SELL"',
      `"${inv.invoiceNo}"`,
      `"${format(new Date(inv.date || inv.createdAt), 'yyyy-MM-dd')}"`,
      `"${inv.billedTo?.name || ''}"`,
      `"${inv.billedTo?.gstin || ''}"`,
      `"${inv.billedTo?.state || ''}"`,
      `"${inv.billedTo?.stateCode || ''}"`,
      `"${inv.diamondType === 'LabGrown' ? 'Lab Grown (CVD)' : 'Natural Diamond'}"`,
      inv.taxableAmount,
      inv.cgstTotal,
      inv.sgstTotal,
      inv.igstTotal,
      inv.totalTax,
      inv.totalValue
    ])

    const purchaseRows = filteredPurchase.map(inv => [
      '"PURCHASE"',
      `"${inv.invoiceNo}"`,
      `"${format(new Date(inv.date || inv.createdAt), 'yyyy-MM-dd')}"`,
      `"${inv.supplier?.name || ''}"`,
      `"${inv.supplier?.gstin || inv.sellerGstin || ''}"`,
      `"${inv.supplier?.state || ''}"`,
      `"${inv.supplier?.stateCode || ''}"`,
      `"${inv.diamondType === 'LabGrown' ? 'Lab Grown (CVD)' : 'Natural Diamond'}"`,
      inv.taxableAmount,
      inv.cgstTotal,
      inv.sgstTotal,
      inv.igstTotal,
      inv.totalTax,
      inv.totalValue
    ])

    const allRows = [...sellRows, ...purchaseRows]
    const csvContent = [headers.join(','), ...allRows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Combined_Invoices_Export_${format(new Date(), 'yyyyMMdd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>CA Export Filter:</span>
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

      <button onClick={handleExportCombinedCSV} className="btn btn-primary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Download size={18} />
        <span>Download Combined CSV (Sell &amp; Purchase)</span>
      </button>
    </div>
  )
}
