export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { Plus, Edit2, Trash2, FileText } from 'lucide-react'
import Link from 'next/link'
import { DeletePurchasePartyButton } from '@/components/DeleteButtons'

export default async function PurchaseSuppliersPage() {
  const suppliers = await prisma.purchaseSupplier.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Manage Suppliers</h1>
          <p className="subtitle">From whom you purchase diamonds</p>
        </div>
        <Link href="/purchase-suppliers/create" className="btn btn-primary">
          <Plus size={20} /> Add Supplier
        </Link>
      </header>

      <div className="glass-card table-container">
        {suppliers.length === 0 ? (
          <div className="empty-state">
            <p>No suppliers yet. <Link href="/purchase-suppliers/create" className="text-link">Add one</Link></p>
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
              {suppliers.map((s: any) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.address}, {s.city}</td>
                  <td className="mono">{s.gstin}</td>
                  <td className="mono">{s.pan}</td>
                  <td>{s.state} ({s.stateCode})</td>
                  <td>
                    <div className="action-btns">
                      <Link href={`/purchase-suppliers/${s.id}/ledger`} className="icon-btn" title="View Ledger"><FileText size={16} /></Link>
                      <Link href={`/purchase-suppliers/edit/${s.id}`} className="icon-btn"><Edit2 size={16} /></Link>
                      <DeletePurchasePartyButton id={s.id} role="supplier" />
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
