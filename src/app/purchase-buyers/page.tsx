export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DeletePurchasePartyButton } from '@/components/DeleteButtons'

export default async function PurchaseBuyersPage() {
  const buyers = await prisma.purchaseBuyer.findMany({ orderBy: { name: 'asc' } })

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
                  <td><strong>{b.name}</strong></td>
                  <td>{b.address}, {b.city}</td>
                  <td className="mono">{b.gstin}</td>
                  <td className="mono">{b.pan}</td>
                  <td>{b.state} ({b.stateCode})</td>
                  <td>
                    <div className="action-btns">
                      <Link href={`/purchase-buyers/edit/${b.id}`} className="icon-btn"><Edit2 size={16} /></Link>
                      <DeletePurchasePartyButton id={b.id} role="buyer" />
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
