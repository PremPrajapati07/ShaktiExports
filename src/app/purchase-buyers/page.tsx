import { Plus, Edit2, FileText } from 'lucide-react'
import Link from 'next/link'
import { DeletePurchasePartyButton } from '@/components/DeleteButtons'
import { getPurchaseBuyers } from '@/lib/actions/purchase-parties'

export default async function PurchaseBuyersPage() {
  const buyers = await getPurchaseBuyers()

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Manage Buyers</h1>
          <p className="subtitle">Who purchases diamonds (our entity)</p>
        </div>
        <Link href="/purchase-buyers/create" className="btn btn-primary">
          <Plus size={20} /> Add Buyer
        </Link>
      </header>

      <div className="glass-card table-container">
        {buyers.length === 0 ? (
          <div className="empty-state">
            <p>No buyers yet. <Link href="/purchase-buyers/create" className="text-link">Add one</Link></p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>GSTIN</th>
                <th>PAN</th>
                <th>State</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((b: any) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <strong>{b.name}</strong>
                      {b.isCompany && (
                        <span style={{ 
                          padding: '0.125rem 0.5rem', 
                          fontSize: '0.7rem', 
                          fontWeight: 600, 
                          background: 'rgba(59, 130, 246, 0.1)', 
                          color: '#3b82f6', 
                          borderRadius: '9999px', 
                          border: '1px solid rgba(59, 130, 246, 0.2)',
                          whiteSpace: 'nowrap'
                        }}>
                          Company Default
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{b.address}, {b.city}</td>
                  <td className="mono">{b.gstin}</td>
                  <td className="mono">{b.pan}</td>
                  <td>{b.state} ({b.stateCode})</td>
                  <td>
                    <div className="action-btns">
                      <Link href={`/purchase-buyers/${b.id}/ledger`} className="icon-btn" title="View Ledger"><FileText size={16} /></Link>
                      <Link href={`/purchase-buyers/edit/${b.id}`} className="icon-btn"><Edit2 size={16} /></Link>
                      {!b.isCompany && <DeletePurchasePartyButton id={b.id} role="buyer" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
