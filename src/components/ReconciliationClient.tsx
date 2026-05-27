'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getUnreconciledInvoices, 
  createPaymentTransaction, 
  deletePaymentTransaction 
} from '@/lib/actions/reconciliation'
import { 
  Coins, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  User, 
  FileText, 
  Check, 
  AlertCircle, 
  CreditCard,
  ExternalLink 
} from 'lucide-react'

interface Party {
  id: number
  name: string
}

interface Supplier {
  id: number
  name: string
}

interface Allocation {
  id: number
  invoiceId: number | null
  purchaseId: number | null
  amount: number
  invoice?: { invoiceNo: string } | null
  purchase?: { invoiceNo: string } | null
}

interface Transaction {
  id: number
  date: Date
  type: string
  amount: number
  paymentMode: string
  referenceNo: string | null
  remarks: string | null
  partyId: number | null
  partyName: string | null
  supplierId: number | null
  supplierName: string | null
  allocations: Allocation[]
}

interface ReconciliationClientProps {
  parties: Party[]
  suppliers: Supplier[]
  transactions: Transaction[]
  currentUserRole: string
}

export function ReconciliationClient({ 
  parties, 
  suppliers, 
  transactions: initialTransactions, 
  currentUserRole 
}: ReconciliationClientProps) {
  const router = useRouter()
  
  // Transactions list state
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'RECEIPT' | 'PAYMENT'>('ALL')

  // Form State
  const [type, setType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT')
  const [partyId, setPartyId] = useState<number | ''>('')
  const [supplierId, setSupplierId] = useState<number | ''>('')
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [amount, setAmount] = useState<number | ''>('')
  const [paymentMode, setPaymentMode] = useState<string>('BANK')
  const [referenceNo, setReferenceNo] = useState('')
  const [remarks, setRemarks] = useState('')

  // Unreconciled bills state
  const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [allocations, setAllocations] = useState<{ [key: number]: number }>({})

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fetch outstanding invoices when party/supplier changes
  useEffect(() => {
    const selectedId = type === 'RECEIPT' ? partyId : supplierId
    if (!selectedId) {
      setOutstandingInvoices([])
      setAllocations({})
      return
    }

    async function loadInvoices() {
      setLoadingInvoices(true)
      try {
        const isPurchase = type === 'PAYMENT'
        const bills = await getUnreconciledInvoices(Number(selectedId), isPurchase)
        setOutstandingInvoices(bills)
        setAllocations({})
      } catch (err: any) {
        console.error(err)
        setError('Failed to fetch outstanding invoices.')
      } finally {
        setLoadingInvoices(false)
      }
    }

    loadInvoices()
  }, [type, partyId, supplierId])

  // Stats calculation
  const totalReceivables = transactions
    .filter(t => t.type === 'RECEIPT')
    .reduce((sum, t) => sum + t.amount, 0)
    
  const totalPayables = transactions
    .filter(t => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0)

  // Auto Allocate
  const handleAutoAllocate = () => {
    const amt = parseFloat(amount.toString())
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid transaction amount first.')
      return
    }

    let remaining = amt
    const newAllocations: { [key: number]: number } = {}

    // Invoices are already sorted oldest first from server action
    for (const inv of outstandingInvoices) {
      if (remaining <= 0) break
      const alloc = Math.min(remaining, inv.outstanding)
      newAllocations[inv.id] = parseFloat(alloc.toFixed(2))
      remaining -= alloc
    }

    setAllocations(newAllocations)
    setError(null)
  }

  // Handle manual allocation input change
  const handleAllocationChange = (invoiceId: number, val: string, outstandingLimit: number) => {
    const amt = parseFloat(val)
    if (isNaN(amt) || amt <= 0) {
      const copy = { ...allocations }
      delete copy[invoiceId]
      setAllocations(copy)
      return
    }

    if (amt > outstandingLimit) {
      setError(`Cannot allocate more than outstanding amount (₹${outstandingLimit.toLocaleString()})`)
      return
    }

    setAllocations(prev => ({
      ...prev,
      [invoiceId]: amt
    }))
    setError(null)
  }

  // Calculated allocated total
  const allocatedTotal = Object.values(allocations).reduce((sum, val) => sum + val, 0)
  const isAllocationOverLimit = amount !== '' && allocatedTotal > Number(amount)

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const parsedAmount = parseFloat(amount.toString())
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid transaction amount.')
      return
    }

    const selectedId = type === 'RECEIPT' ? partyId : supplierId
    if (!selectedId) {
      setError(`Please select a ${type === 'RECEIPT' ? 'customer' : 'supplier'}.`)
      return
    }

    if (isAllocationOverLimit) {
      setError('Allocated amount exceeds total transaction amount.')
      return
    }

    setIsSubmitting(true)

    try {
      const formattedAllocations = Object.entries(allocations).map(([id, val]) => ({
        invoiceId: type === 'RECEIPT' ? Number(id) : undefined,
        purchaseId: type === 'PAYMENT' ? Number(id) : undefined,
        amount: val
      }))

      await createPaymentTransaction({
        date: new Date(date),
        type,
        amount: parsedAmount,
        paymentMode,
        referenceNo: referenceNo || undefined,
        remarks: remarks || undefined,
        partyId: type === 'RECEIPT' ? Number(partyId) : undefined,
        supplierId: type === 'PAYMENT' ? Number(supplierId) : undefined,
        allocations: formattedAllocations
      })

      setSuccess('Transaction saved and reconciled successfully!')
      
      // Reset Form
      setPartyId('')
      setSupplierId('')
      setAmount('')
      setReferenceNo('')
      setRemarks('')
      setAllocations({})
      setOutstandingInvoices([])

      // Refresh data
      router.refresh()
      
      // We can reload the page or let server actions update, but a page reload gets the updated transaction list
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Handler
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this payment transaction? This will also revert all allocations.')) {
      return
    }

    try {
      await deletePaymentTransaction(id)
      setSuccess('Transaction deleted successfully.')
      router.refresh()
      window.location.reload()
    } catch (err: any) {
      setError(err.message || 'Failed to delete transaction.')
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const nameMatch = (tx.partyName || tx.supplierName || '').toLowerCase().includes(searchQuery.toLowerCase())
    const refMatch = (tx.referenceNo || '').toLowerCase().includes(searchQuery.toLowerCase())
    const searchMatch = nameMatch || refMatch

    if (filterType === 'ALL') return searchMatch
    return tx.type === filterType && searchMatch
  })

  return (
    <div className="reconciliation-container">
      {/* Overview stats */}
      <div className="stats-grid">
        <div className="stat-card glass-card">
          <div className="icon-container blue">
            <Coins size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Receipts Collected</span>
            <span className="stat-value text-success">₹{totalReceivables.toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="icon-container purple">
            <CreditCard size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Payouts Made</span>
            <span className="stat-value text-error">₹{totalPayables.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}

      <div className="main-grid">
        {/* Record Transaction Form */}
        <div className="glass-card form-section">
          <h2>Record Payment & Reconcile</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <div className="radio-group">
                <button 
                  type="button" 
                  className={`radio-btn ${type === 'RECEIPT' ? 'active' : ''}`}
                  onClick={() => { setType('RECEIPT'); setPartyId(''); setSupplierId(''); }}
                >
                  Receipt (Customer Pay-In)
                </button>
                <button 
                  type="button" 
                  className={`radio-btn ${type === 'PAYMENT' ? 'active' : ''}`}
                  onClick={() => { setType('PAYMENT'); setPartyId(''); setSupplierId(''); }}
                >
                  Payment (Supplier Pay-Out)
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <div className="input-with-icon">
                  <Calendar className="icon" size={16} />
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    className="form-input" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {type === 'RECEIPT' ? 'Customer (Party)' : 'Supplier'}
                </label>
                <div className="input-with-icon">
                  <User className="icon" size={16} />
                  {type === 'RECEIPT' ? (
                    <select 
                      value={partyId} 
                      onChange={(e) => setPartyId(e.target.value === '' ? '' : Number(e.target.value))} 
                      className="form-input select-input"
                      required
                    >
                      <option value="">Select Customer...</option>
                      {parties.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  ) : (
                    <select 
                      value={supplierId} 
                      onChange={(e) => setSupplierId(e.target.value === '' ? '' : Number(e.target.value))} 
                      className="form-input select-input"
                      required
                    >
                      <option value="">Select Supplier...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 50000"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))} 
                  className="form-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select 
                  value={paymentMode} 
                  onChange={(e) => setPaymentMode(e.target.value)} 
                  className="form-input"
                >
                  <option value="BANK">Bank Transfer / NEFT</option>
                  <option value="CASH">Cash</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="UPI">UPI (GPay/PhonePe)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reference No / Tx ID</label>
              <input 
                type="text" 
                placeholder="e.g. UTR-938210398, Cheque No" 
                value={referenceNo} 
                onChange={(e) => setReferenceNo(e.target.value)} 
                className="form-input" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea 
                placeholder="Internal notes..." 
                value={remarks} 
                onChange={(e) => setRemarks(e.target.value)} 
                className="form-input" 
                rows={2}
              />
            </div>

            {/* Bill Allocations Section */}
            {(partyId !== '' || supplierId !== '') && (
              <div className="allocations-section">
                <div className="section-header">
                  <h3>Allocate to Outstanding Bills</h3>
                  {outstandingInvoices.length > 0 && amount !== '' && Number(amount) > 0 && (
                    <button 
                      type="button" 
                      onClick={handleAutoAllocate}
                      className="btn btn-outline btn-xs"
                    >
                      <Plus size={14} /> Auto Allocate (Oldest First)
                    </button>
                  )}
                </div>

                {loadingInvoices ? (
                  <p className="loading-text">Loading outstanding bills...</p>
                ) : outstandingInvoices.length === 0 ? (
                  <p className="no-bills-text">No outstanding invoices found for this party.</p>
                ) : (
                  <div className="bills-list-wrapper">
                    <table className="bills-table">
                      <thead>
                        <tr>
                          <th>Bill No</th>
                          <th>Date</th>
                          <th>Outstanding</th>
                          <th style={{ width: '120px' }}>Allocate (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {outstandingInvoices.map((inv) => (
                          <tr key={inv.id}>
                            <td>
                              <span className="bill-no">
                                {inv.invoiceNo}
                                {type === 'RECEIPT' ? (
                                  <a href={`/invoices/view/${inv.id}`} target="_blank" rel="noreferrer" className="bill-link">
                                    <ExternalLink size={12} />
                                  </a>
                                ) : (
                                  <a href={`/purchase-invoices/view/${inv.id}`} target="_blank" rel="noreferrer" className="bill-link">
                                    <ExternalLink size={12} />
                                  </a>
                                )}
                              </span>
                            </td>
                            <td>{new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                            <td>₹{inv.outstanding.toLocaleString()}</td>
                            <td>
                              <input 
                                type="number" 
                                step="0.01"
                                min="0"
                                max={inv.outstanding}
                                className="form-input alloc-input"
                                placeholder="0.00"
                                value={allocations[inv.id] || ''}
                                onChange={(e) => handleAllocationChange(inv.id, e.target.value, inv.outstanding)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="allocations-summary">
                      <div>
                        <span>Total Selected Allocation: </span>
                        <span className={isAllocationOverLimit ? 'text-error font-bold' : 'font-bold'}>
                          ₹{allocatedTotal.toLocaleString()}
                        </span>
                        {amount !== '' && (
                          <span> / ₹{Number(amount).toLocaleString()}</span>
                        )}
                      </div>
                      {amount !== '' && Number(amount) > allocatedTotal && (
                        <div className="unallocated-warning">
                          * Remaining ₹{(Number(amount) - allocatedTotal).toLocaleString()} will be kept as unallocated advance.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary w-full submit-btn"
              disabled={isSubmitting || isAllocationOverLimit}
            >
              {isSubmitting ? 'Saving Transaction...' : 'Save & Reconcile'}
            </button>
          </form>
        </div>

        {/* Transactions List */}
        <div className="glass-card list-section">
          <div className="list-header">
            <h2>Recent Payments</h2>
            <div className="filters-container">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search party or ref..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)}
                className="filter-select"
              >
                <option value="ALL">All types</option>
                <option value="RECEIPT">Receipts</option>
                <option value="PAYMENT">Payouts</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Party Name</th>
                  <th>Amount</th>
                  <th>Mode / Ref</th>
                  <th>Allocated Bills</th>
                  {currentUserRole === 'ADMIN' && <th style={{ width: '40px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <span className={`type-badge ${tx.type.toLowerCase()}`}>
                        {tx.type === 'RECEIPT' ? 'Receipt' : 'Payout'}
                      </span>
                    </td>
                    <td>
                      <span className="party-name-span">
                        {tx.type === 'RECEIPT' ? tx.partyName : tx.supplierName}
                      </span>
                    </td>
                    <td className="font-bold">
                      ₹{tx.amount.toLocaleString()}
                    </td>
                    <td>
                      <div className="mode-details">
                        <span className="mode-tag">{tx.paymentMode}</span>
                        {tx.referenceNo && <span className="ref-no">{tx.referenceNo}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="allocations-list">
                        {tx.allocations.length === 0 ? (
                          <span className="text-muted italic">Unallocated Advance</span>
                        ) : (
                          tx.allocations.map(a => (
                            <span key={a.id} className="alloc-badge">
                              {a.invoice?.invoiceNo || a.purchase?.invoiceNo}: ₹{a.amount.toLocaleString()}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    {currentUserRole === 'ADMIN' && (
                      <td>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDelete(tx.id)}
                          title="Delete Transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={currentUserRole === 'ADMIN' ? 7 : 6} className="empty-row">
                      No payment transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style jsx>{`
        .reconciliation-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-container {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-container.blue {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent);
        }

        .icon-container.purple {
          background: rgba(168, 85, 247, 0.1);
          color: #a855f7;
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .text-success {
          color: var(--success);
        }

        .text-error {
          color: var(--error);
        }

        .font-bold {
          font-weight: 600;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: var(--radius);
          font-weight: 500;
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .alert-success {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .main-grid {
            grid-template-columns: 450px 1fr;
          }
        }

        .form-section h2, .list-section h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .radio-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
          background: var(--sidebar-hover);
          padding: 0.25rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }

        .radio-btn {
          padding: 0.5rem;
          border-radius: calc(var(--radius) - 2px);
          font-size: 0.875rem;
          font-weight: 500;
          text-align: center;
          transition: all 0.2s;
          color: var(--text-muted);
        }

        .radio-btn.active {
          background: var(--card-bg);
          color: var(--foreground);
          box-shadow: var(--shadow-sm);
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon .icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .input-with-icon .form-input {
          padding-left: 2.25rem;
        }

        .select-input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 16px;
          padding-right: 2rem;
        }

        .allocations-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .section-header h3 {
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0;
        }

        .btn-xs {
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }

        .loading-text, .no-bills-text {
          font-size: 0.875rem;
          color: var(--text-muted);
          text-align: center;
          padding: 1rem;
        }

        .bills-list-wrapper {
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--background);
        }

        .bills-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .bills-table th, .bills-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .bills-table th {
          font-weight: 500;
          color: var(--text-muted);
          background: rgba(0,0,0,0.02);
        }

        .bill-no {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-weight: 600;
        }

        .bill-link {
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
        }

        .bill-link:hover {
          color: var(--accent);
        }

        .alloc-input {
          padding: 0.375rem;
          font-size: 0.825rem;
        }

        .allocations-summary {
          padding: 0.75rem;
          background: var(--sidebar-hover);
          font-size: 0.875rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .unallocated-warning {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-style: italic;
        }

        .w-full {
          width: 100%;
        }

        .submit-btn {
          margin-top: 1.5rem;
        }

        /* List Section Styles */
        .list-header {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 768px) {
          .list-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .list-header h2 {
          margin-bottom: 0;
        }

        .filters-container {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-box input {
          padding: 0.5rem 0.75rem 0.5rem 2.25rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--background);
          color: var(--foreground);
          font-size: 0.875rem;
          width: 180px;
        }

        .search-box svg {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
        }

        .filter-select {
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--background);
          color: var(--foreground);
          font-size: 0.875rem;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .data-table th, .data-table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .data-table th {
          color: var(--text-muted);
          font-weight: 500;
        }

        .type-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .type-badge.receipt {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success);
        }

        .type-badge.payment {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }

        .party-name-span {
          font-weight: 500;
        }

        .mode-details {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .mode-tag {
          font-weight: 500;
        }

        .ref-no {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .allocations-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          max-width: 250px;
        }

        .alloc-badge {
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          background: var(--sidebar-hover);
          border: 1px solid var(--border);
          border-radius: 4px;
          white-space: nowrap;
        }

        .btn-delete {
          color: var(--text-muted);
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-delete:hover {
          color: var(--error);
          background: rgba(239, 68, 68, 0.1);
        }

        .empty-row {
          text-align: center;
          padding: 2rem !important;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
