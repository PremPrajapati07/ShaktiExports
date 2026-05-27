export const dynamic = 'force-dynamic'

import { getAuthSession } from '@/lib/auth'
import { getParties } from '@/lib/actions/parties'
import { getSuppliers } from '@/lib/actions/purchase-parties'
import { getPaymentTransactions } from '@/lib/actions/reconciliation'
import { ReconciliationClient } from '@/components/ReconciliationClient'
import { redirect } from 'next/navigation'

export default async function ReconciliationPage() {
  const session = await getAuthSession()
  if (!session) {
    redirect('/login')
  }

  if (!['ADMIN', 'ACCOUNTANT'].includes(session.role)) {
    redirect('/unauthorized')
  }

  const [parties, suppliers, transactions] = await Promise.all([
    getParties(),
    getSuppliers(),
    getPaymentTransactions()
  ])

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            Payment Reconciliation
          </h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
            Track receipts and payouts, reconcile against outstanding bills, and maintain clean balances
          </p>
        </div>
      </header>

      <ReconciliationClient 
        parties={parties} 
        suppliers={suppliers} 
        transactions={transactions as any} 
        currentUserRole={session.role}
      />
    </div>
  )
}
