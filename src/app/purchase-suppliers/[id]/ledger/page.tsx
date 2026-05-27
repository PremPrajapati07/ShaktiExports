import { getPartyLedger } from '@/lib/actions/stock'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ExternalLink, ArrowLeft, Coins, Package, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
  searchParams?: Promise<{ tab?: string }>
}

export default async function PurchaseSupplierLedgerPage({ params, searchParams }: Props) {
  const { id: idStr } = await params
  const { tab = 'stock' } = (await searchParams) || {}
  const id = parseInt(idStr)
  if (isNaN(id)) notFound()

  const party = await prisma.purchaseSupplier.findUnique({ where: { id } })
  if (!party) notFound()

  // 1. Stock Ledger Data
  const stockLedger = await getPartyLedger(id, 'SUPPLIER')
  const totalLabGrown = stockLedger.filter(l => l.diamondType === 'LabGrown').reduce((sum, l) => sum + (l.transactionType === 'SELL' ? -l.carats : l.carats), 0)
  const totalNatural = stockLedger.filter(l => l.diamondType === 'Natural').reduce((sum, l) => sum + (l.transactionType === 'SELL' ? -l.carats : l.carats), 0)

  // 2. Financial Ledger Data
  const [purchaseInvoices, payments] = await Promise.all([
    prisma.purchaseInvoice.findMany({
      where: { supplierId: id },
      orderBy: { date: 'asc' }
    }),
    prisma.paymentTransaction.findMany({
      where: { supplierId: id, type: 'PAYMENT' },
      include: {
        allocations: {
          include: {
            purchase: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })
  ])

  const financialLedger: {
    date: Date
    type: 'PURCHASE_INVOICE' | 'PAYMENT'
    docId: number
    docNo: string
    debit: number
    credit: number
    paymentMode?: string
    allocationsText?: string
  }[] = []

  purchaseInvoices.forEach(inv => {
    financialLedger.push({
      date: inv.date,
      type: 'PURCHASE_INVOICE',
      docId: inv.id,
      docNo: inv.invoiceNo,
      debit: 0,
      credit: inv.totalValue
    })
  })

  payments.forEach(pay => {
    const allocs = pay.allocations
      .map(a => `${a.purchase?.invoiceNo || 'Bill'}: ₹${a.amount.toLocaleString()}`)
      .join(', ')

    financialLedger.push({
      date: pay.date,
      type: 'PAYMENT',
      docId: pay.id,
      docNo: pay.referenceNo || `PAY-${pay.id}`,
      debit: pay.amount,
      credit: 0,
      paymentMode: pay.paymentMode,
      allocationsText: allocs || 'Unallocated Advance'
    })
  })

  // Sort by date
  financialLedger.sort((a, b) => a.date.getTime() - b.date.getTime())

  // Totals
  const totalBilled = purchaseInvoices.reduce((sum, inv) => sum + inv.totalValue, 0)
  const totalPaid = payments.reduce((sum, pay) => sum + pay.amount, 0)
  const netOutstanding = totalBilled - totalPaid

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/purchase-suppliers" className="text-muted hover:text-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Suppliers
        </Link>
      </div>

      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            Ledger: {party.name}
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            View transaction history and balance statements
          </p>
        </div>
      </header>

      {/* Tabs navigation */}
      <div className="tabs-container" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '2rem', paddingBottom: '0.5rem' }}>
        <Link 
          href={`/purchase-suppliers/${id}/ledger?tab=stock`} 
          className={`tab-link ${tab === 'stock' ? 'active' : ''}`}
          style={{
            padding: '0.5rem 1rem',
            fontWeight: 600,
            borderBottom: tab === 'stock' ? '2px solid var(--accent)' : 'none',
            color: tab === 'stock' ? 'var(--accent)' : 'var(--text-muted)'
          }}
        >
          Diamond Stock Ledger
        </Link>
        <Link 
          href={`/purchase-suppliers/${id}/ledger?tab=financial`} 
          className={`tab-link ${tab === 'financial' ? 'active' : ''}`}
          style={{
            padding: '0.5rem 1rem',
            fontWeight: 600,
            borderBottom: tab === 'financial' ? '2px solid var(--accent)' : 'none',
            color: tab === 'financial' ? 'var(--accent)' : 'var(--text-muted)'
          }}
        >
          Financial Ledger
        </Link>
      </div>

      {tab === 'stock' ? (
        <>
          <div className="overview-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h2 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 0 }}>Net Lab Grown (Cts)</h2>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: totalLabGrown < 0 ? '#e53e3e' : 'var(--text-success)' }}>
                {totalLabGrown.toFixed(2)}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h2 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 0 }}>Net Natural (Cts)</h2>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: totalNatural < 0 ? '#e53e3e' : 'var(--text-success)' }}>
                {totalNatural.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Diamond</th>
                    <th>Carats</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {stockLedger.map((entry) => (
                    <tr key={entry.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(entry.createdAt), 'dd MMM yyyy HH:mm')}</td>
                      <td>
                        <span className={`type-badge ${entry.transactionType.toLowerCase()}`} style={{
                          background: entry.transactionType === 'PURCHASE' ? 'var(--bg-success)' : entry.transactionType === 'SELL' ? 'var(--bg-warning)' : 'var(--bg-info)',
                          color: entry.transactionType === 'PURCHASE' ? 'var(--text-success)' : entry.transactionType === 'SELL' ? 'var(--text-warning)' : 'var(--text-info)',
                        }}>
                          {entry.transactionType}
                        </span>
                      </td>
                      <td>{entry.diamondType === 'LabGrown' ? 'Lab Grown' : 'Natural'}</td>
                      <td style={{ fontWeight: 'bold', color: entry.transactionType === 'SELL' ? 'var(--text-warning)' : 'var(--text-success)' }}>
                        {entry.transactionType === 'SELL' ? '-' : '+'}{entry.carats.toFixed(2)}
                      </td>
                      <td>
                        {entry.referenceNo ? (
                          entry.transactionType === 'PURCHASE' && entry.referenceId ? (
                            <Link href={`/purchase-invoices/view/${entry.referenceId}`} className="text-primary hover:underline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              {entry.referenceNo} <ExternalLink size={12} />
                            </Link>
                          ) : entry.transactionType === 'SELL' && entry.referenceId ? (
                            <Link href={`/invoices/view/${entry.referenceId}`} className="text-primary hover:underline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              {entry.referenceNo} <ExternalLink size={12} />
                            </Link>
                          ) : (
                            entry.referenceNo
                          )
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                  {stockLedger.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No stock transactions found for this supplier.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="overview-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h2 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 0 }}>Total Purchases Billed</h2>
              <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                ₹{totalBilled.toLocaleString()}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h2 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 0 }}>Total Paid (Payouts)</h2>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-success)' }}>
                ₹{totalPaid.toLocaleString()}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h2 style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 0 }}>Net Payable Due</h2>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: netOutstanding > 0.01 ? '#e53e3e' : netOutstanding < -0.01 ? 'var(--text-success)' : 'inherit' }}>
                {netOutstanding > 0.01 ? `₹${netOutstanding.toLocaleString()} (Due)` : netOutstanding < -0.01 ? `₹${Math.abs(netOutstanding).toLocaleString()} (Paid in Advance)` : '₹0.00'}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Doc Type</th>
                    <th>Doc No / Ref</th>
                    <th>Debit (Paid)</th>
                    <th>Credit (Billed)</th>
                    <th>Running Balance</th>
                    <th>Details / Allocations</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let running = 0
                    return financialLedger.map((entry, idx) => {
                      running += entry.credit - entry.debit
                      return (
                        <tr key={idx}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            {format(new Date(entry.date), 'dd MMM yyyy')}
                          </td>
                          <td>
                            <span className={`type-badge ${entry.type.toLowerCase()}`} style={{
                              background: entry.type === 'PURCHASE_INVOICE' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                              color: entry.type === 'PURCHASE_INVOICE' ? '#a855f7' : 'var(--text-success)'
                            }}>
                              {entry.type === 'PURCHASE_INVOICE' ? 'Purchase Bill' : 'Payout'}
                            </span>
                          </td>
                          <td>
                            {entry.type === 'PURCHASE_INVOICE' ? (
                              <Link href={`/purchase-invoices/view/${entry.docId}`} className="text-primary hover:underline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                {entry.docNo} <ExternalLink size={12} />
                              </Link>
                            ) : (
                              <span style={{ fontWeight: 500 }}>{entry.docNo}</span>
                            )}
                          </td>
                          <td style={{ color: entry.debit > 0 ? 'var(--text-success)' : 'inherit', fontWeight: entry.debit > 0 ? '600' : 'normal' }}>
                            {entry.debit > 0 ? `₹${entry.debit.toLocaleString()}` : '-'}
                          </td>
                          <td style={{ color: entry.credit > 0 ? '#e53e3e' : 'inherit', fontWeight: entry.credit > 0 ? '600' : 'normal' }}>
                            {entry.credit > 0 ? `₹${entry.credit.toLocaleString()}` : '-'}
                          </td>
                          <td style={{ fontWeight: 'bold' }}>
                            ₹{running.toLocaleString()}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {entry.type === 'PAYMENT' ? (
                              <div>
                                <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>Mode:</span> {entry.paymentMode}
                                {entry.allocationsText && (
                                  <div style={{ marginTop: '0.25rem' }}>
                                    <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>Allocated:</span> {entry.allocationsText}
                                  </div>
                                )}
                              </div>
                            ) : (
                              'Purchase Invoice Total'
                            )}
                          </td>
                        </tr>
                      )
                    })
                  })()}
                  {financialLedger.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No billing or payment history found for this supplier.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

