'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { adjustStockManually, updateManualAdjustment, deleteManualAdjustment } from '@/lib/actions/stock'
import Link from 'next/link'
import { ExternalLink, Plus, Minus, Search, Download } from 'lucide-react'

export function StockDashboard({ overview, ledger }: { overview: any, ledger: any[] }) {
  const [filterType, setFilterType] = useState<'All' | 'LabGrown' | 'Natural'>('All')
  const [filterTransaction, setFilterTransaction] = useState<'All' | 'PURCHASE' | 'SELL' | 'MANUAL_ADJUSTMENT'>('All')
  const [filterParty, setFilterParty] = useState('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Modal State
  const [loading, setLoading] = useState(false)
  const [adjType, setAdjType] = useState<'LabGrown' | 'Natural'>('LabGrown')
  const [adjMode, setAdjMode] = useState<'ADD' | 'SUBTRACT'>('ADD')
  const [adjCarats, setAdjCarats] = useState<string>('')
  const [adjRemarks, setAdjRemarks] = useState('')
  const [adjDate, setAdjDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState<any>(null)
  const [editDate, setEditDate] = useState('')
  const [editMode, setEditMode] = useState<'ADD' | 'SUBTRACT'>('ADD')
  const [editCarats, setEditCarats] = useState('')
  const [editRemarks, setEditRemarks] = useState('')

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const carats = parseFloat(adjCarats)
      if (isNaN(carats) || carats <= 0) {
        alert("Please enter a valid positive number for carats.")
        setLoading(false)
        return
      }

      await adjustStockManually({
        diamondType: adjType,
        carats: adjMode === 'ADD' ? carats : -carats,
        remarks: adjRemarks,
        date: adjDate
      })
      
      setIsModalOpen(false)
      setAdjCarats('')
      setAdjRemarks('')
      setAdjDate(format(new Date(), 'yyyy-MM-dd'))
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEntry) return
    setLoading(true)
    try {
      const carats = parseFloat(editCarats)
      if (isNaN(carats) || carats <= 0) {
        alert("Please enter a valid positive number for carats.")
        setLoading(false)
        return
      }

      await updateManualAdjustment(editingEntry.id, {
        date: editDate,
        carats: editMode === 'ADD' ? carats : -carats,
        remarks: editRemarks
      })

      setEditingEntry(null)
    } catch (err: any) {
      alert(err.message || 'Failed to update adjustment')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editingEntry) return
    if (confirm('Are you sure you want to delete this manual adjustment? This will permanently revert its effect on your stock balance.')) {
      setLoading(true)
      try {
        await deleteManualAdjustment(editingEntry.id)
        setEditingEntry(null)
      } catch (err: any) {
        alert(err.message || 'Failed to delete adjustment')
      } finally {
        setLoading(false)
      }
    }
  }

  const uniqueParties = Array.from(new Set(ledger.filter(l => l.partyName).map(l => l.partyName as string)))

  const filteredLedger = ledger.filter(l => {
    if (filterType !== 'All' && l.diamondType !== filterType) return false
    if (filterTransaction !== 'All' && l.transactionType !== filterTransaction) return false
    if (filterParty !== 'All' && l.partyName !== filterParty) return false
    return true
  })

  const handleDownloadCsv = () => {
    const headers = [
      'Date',
      'Transaction Type',
      'Diamond Type',
      'Carats',
      'Party Name',
      'Party Type',
      'Reference',
      'Remarks'
    ]

    const rows = filteredLedger.map(entry => {
      const isNegative = entry.transactionType === 'SELL' || (entry.transactionType === 'MANUAL_ADJUSTMENT' && entry.carats < 0)
      return [
        `"${format(new Date(entry.date), 'yyyy-MM-dd')}"`,
        `"${entry.transactionType}"`,
        `"${entry.diamondType === 'LabGrown' ? 'Lab Grown' : 'Natural'}"`,
        (isNegative ? '-' : '+') + Math.abs(entry.carats).toString(),
        `"${entry.partyName || ''}"`,
        `"${entry.partyType || ''}"`,
        `"${entry.referenceNo || ''}"`,
        `"${entry.remarks || ''}"`
      ]
    })

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Stock_Ledger_${format(new Date(), 'yyyyMMdd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="stock-dashboard animate-fade-in">
      <div className="overview-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'linear-gradient(135deg, rgba(235, 248, 255, 0.7), rgba(255, 255, 255, 0.5))' }}>
          <h2 style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>Lab Grown Diamonds</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
            {overview.labGrown.toFixed(2)} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Cts</span>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'linear-gradient(135deg, rgba(255, 245, 245, 0.7), rgba(255, 255, 255, 0.5))' }}>
          <h2 style={{ color: '#e53e3e', fontSize: '1.25rem' }}>Natural Diamonds</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--foreground)' }}>
            {overview.natural.toFixed(2)} <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Cts</span>
          </div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary" style={{ width: '100%', height: '100%', minHeight: '80px', fontSize: '1.1rem' }}>
            Manual Stock Adjustment
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h2>Stock Ledger History</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <select 
              className="form-input" 
              style={{ width: 'auto', marginBottom: 0 }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="All">All Diamonds</option>
              <option value="LabGrown">Lab Grown Only</option>
              <option value="Natural">Natural Only</option>
            </select>
            <select 
              className="form-input" 
              style={{ width: 'auto', marginBottom: 0 }}
              value={filterTransaction}
              onChange={(e) => setFilterTransaction(e.target.value as any)}
            >
              <option value="All">All Types</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SELL">Sell</option>
              <option value="MANUAL_ADJUSTMENT">Manual</option>
            </select>
            <select 
              className="form-input" 
              style={{ width: 'auto', marginBottom: 0 }}
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
            >
              <option value="All">All Parties</option>
              {uniqueParties.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button onClick={handleDownloadCsv} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Diamond</th>
                <th>Carats</th>
                <th>Party</th>
                <th>Reference</th>
                <th>Remarks</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.map((entry) => {
                const isNegative = entry.transactionType === 'SELL' || (entry.transactionType === 'MANUAL_ADJUSTMENT' && entry.carats < 0);
                return (
                  <tr key={entry.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {format(new Date(entry.date), entry.transactionType === 'MANUAL_ADJUSTMENT' ? 'dd MMM yyyy' : 'dd MMM yyyy HH:mm')}
                    </td>
                    <td>
                      <span className={`type-badge ${entry.transactionType.toLowerCase()}`} style={{
                        background: entry.transactionType === 'PURCHASE' ? 'var(--bg-success)' : entry.transactionType === 'SELL' ? 'var(--bg-warning)' : 'var(--bg-info)',
                        color: entry.transactionType === 'PURCHASE' ? 'var(--text-success)' : entry.transactionType === 'SELL' ? 'var(--text-warning)' : 'var(--text-info)',
                      }}>
                        {entry.transactionType === 'MANUAL_ADJUSTMENT' ? (entry.carats >= 0 ? 'MANUAL ADD' : 'MANUAL SUB') : entry.transactionType}
                      </span>
                    </td>
                    <td>{entry.diamondType === 'LabGrown' ? 'Lab Grown' : 'Natural'}</td>
                    <td style={{ fontWeight: 'bold', color: isNegative ? 'var(--text-warning)' : 'var(--text-success)' }}>
                      {isNegative ? '-' : '+'}{Math.abs(entry.carats).toFixed(2)}
                    </td>
                  <td>
                    {entry.partyName ? (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{entry.partyName}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{entry.partyType}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    {entry.referenceNo ? (
                      entry.transactionType === 'PURCHASE' && entry.referenceId ? (
                        <Link href={`/purchase-invoices/view/${entry.referenceId}`} className="text-primary hover:underline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {entry.referenceNo} <ExternalLink size={12} />
                        </Link>
                      ) : entry.transactionType === 'SELL' && entry.referenceId ? (
                        <Link href={`/invoices/view/${entry.referenceId}`} className="text-primary hover:underline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {entry.referenceNo} <ExternalLink size={12} />
                        </Link>
                      ) : (
                        entry.referenceNo
                      )
                    ) : '-'}
                  </td>
                    <td>{entry.remarks || '-'}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {entry.transactionType === 'MANUAL_ADJUSTMENT' && (
                        <button
                          onClick={() => {
                            setEditingEntry(entry)
                            setEditDate(format(new Date(entry.date), 'yyyy-MM-dd'))
                            setEditMode(entry.carats >= 0 ? 'ADD' : 'SUBTRACT')
                            setEditCarats(Math.abs(entry.carats).toString())
                            setEditRemarks(entry.remarks || '')
                          }}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No stock history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Manual Stock Adjustment</h2>
            <form onSubmit={handleAdjust}>
              <div className="form-group">
                <label className="form-label">Diamond Type</label>
                <select className="form-input" value={adjType} onChange={(e) => setAdjType(e.target.value as any)}>
                  <option value="LabGrown">Lab Grown (CVD)</option>
                  <option value="Natural">Natural Diamond</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Adjustment Date</label>
                <input type="date" required className="form-input" value={adjDate} onChange={e => setAdjDate(e.target.value)} />
              </div>
              
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Action</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setAdjMode('ADD')} className={`btn ${adjMode === 'ADD' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>
                      <Plus size={16} /> Add
                    </button>
                    <button type="button" onClick={() => setAdjMode('SUBTRACT')} className={`btn ${adjMode === 'SUBTRACT' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, backgroundColor: adjMode === 'SUBTRACT' ? '#e53e3e' : '', borderColor: adjMode === 'SUBTRACT' ? '#e53e3e' : '' }}>
                      <Minus size={16} /> Subtract
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Carats</label>
                  <input type="number" step="0.01" min="0" required className="form-input" value={adjCarats} onChange={e => setAdjCarats(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks / Reason</label>
                <textarea required className="form-input" rows={3} value={adjRemarks} onChange={e => setAdjRemarks(e.target.value)} placeholder="E.g., Physical stock verification difference..." />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card animate-scale-in" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Edit Manual Stock Adjustment</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label className="form-label">Diamond Type</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingEntry.diamondType === 'LabGrown' ? 'Lab Grown (CVD)' : 'Natural Diamond'}
                  disabled
                />
              </div>

              <div className="form-group">
                <label className="form-label">Adjustment Date</label>
                <input type="date" required className="form-input" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
              
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Action</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={() => setEditMode('ADD')} className={`btn ${editMode === 'ADD' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1 }}>
                      <Plus size={16} /> Add
                    </button>
                    <button type="button" onClick={() => setEditMode('SUBTRACT')} className={`btn ${editMode === 'SUBTRACT' ? 'btn-primary' : 'btn-outline'}`} style={{ flex: 1, backgroundColor: editMode === 'SUBTRACT' ? '#e53e3e' : '', borderColor: editMode === 'SUBTRACT' ? '#e53e3e' : '' }}>
                      <Minus size={16} /> Subtract
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Carats</label>
                  <input type="number" step="0.01" min="0" required className="form-input" value={editCarats} onChange={e => setEditCarats(e.target.value)} placeholder="0.00" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks / Reason</label>
                <textarea required className="form-input" rows={3} value={editRemarks} onChange={e => setEditRemarks(e.target.value)} placeholder="E.g., Physical stock verification difference..." />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
                <button type="button" onClick={handleDelete} className="btn btn-outline" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444' }} disabled={loading}>
                  Delete
                </button>
                <button type="button" onClick={() => setEditingEntry(null)} className="btn btn-outline" style={{ flex: 1 }} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
