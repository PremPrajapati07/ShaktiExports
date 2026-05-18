import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DeletePartyButton } from '@/components/DeleteButtons'

export default async function ConsigneesPage() {
  const consignees = await prisma.party.findMany({
    where: { type: 'ShippedTo' },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="consignees-page animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Manage Consignees</h1>
          <p className="subtitle">Manage shipping destinations (Shipped To)</p>
        </div>
        <Link href="/consignees/create" className="btn btn-primary">
          <Plus size={20} />
          <span>Add Consignee</span>
        </Link>
      </header>

      <div className="glass-card table-container">
        {consignees.length === 0 ? (
          <div className="empty-state">
            <p>No consignees found. Click "Add Consignee" to create one.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Consignee Name</th>
                <th>City & State</th>
                <th>GSTIN</th>
                <th>PAN</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {consignees.map((party: any) => (
                <tr key={party.id}>
                  <td className="font-bold">{party.name}</td>
                  <td>
                    <div className="city-state">
                      {party.city}, {party.state}
                      <span className="badge">{party.stateCode}</span>
                    </div>
                  </td>
                  <td className="mono">{party.gstin}</td>
                  <td className="mono">{party.pan}</td>
                  <td>
                    <div className="actions">
                      <Link href={`/consignees/edit/${party.id}`} className="action-btn edit">
                        <Edit2 size={16} />
                      </Link>
                      <DeletePartyButton id={party.id} />
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
