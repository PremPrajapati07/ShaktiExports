export const dynamic = 'force-dynamic'

import { getStockOverview, getStockLedger } from '@/lib/actions/stock'
import { StockDashboard } from '@/components/StockDashboard'

export default async function StockPage() {
  const overview = await getStockOverview()
  const ledger = await getStockLedger()

  return (
    <div>
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Stock &amp; Inventory</h1>
          <p className="page-subtitle">Manage your diamond stock and view the complete history of incoming and outgoing inventory.</p>
        </div>
      </header>
      <StockDashboard overview={overview} ledger={ledger} />
    </div>
  )
}
