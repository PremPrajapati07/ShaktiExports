import { getPartyLedger } from '@/lib/actions/stock'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { ExternalLink, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PartyLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  if (isNaN(id)) notFound()

  const party = await prisma.party.findUnique({ where: { id } })
  if (!party) notFound()

  const ledger = await getPartyLedger(id, 'BUYER')

  // Calculate totals
  const totalLabGrown = ledger.filter(l => l.diamondType === 'LabGrown').reduce((sum, l) => sum + (l.transactionType === 'SELL' ? -l.carats : l.carats), 0)
  const totalNatural = ledger.filter(l => l.diamondType === 'Natural').reduce((sum, l) => sum + (l.transactionType === 'SELL' ? -l.carats : l.carats), 0)

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/parties" className="text-muted hover:text-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Parties
        </Link>
      </div>

      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Ledger: {party.name}</h1>
          <p className="page-subtitle">Detailed diamond stock history for this party</p>
        </div>
      </header>

      <div className="overview-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Net Lab Grown (Cts)</h2>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: totalLabGrown < 0 ? '#e53e3e' : 'var(--text-success)' }}>
            {totalLabGrown.toFixed(2)}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h2 style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>Net Natural (Cts)</h2>
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
              {ledger.map((entry) => (
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
                </tr>
              ))}
              {ledger.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No stock transactions found for this party.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
