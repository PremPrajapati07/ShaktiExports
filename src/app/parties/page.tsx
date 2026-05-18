import { getParties } from '@/lib/actions/parties'
export const dynamic = 'force-dynamic'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DeletePartyButton } from '@/components/DeleteButtons'

export default async function PartiesPage() {
  const parties = await getParties()

  return (
    <div className="parties-page animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Manage Parties</h1>
          <p className="subtitle">Create and manage your billed-to parties</p>
        </div>
        <Link href="/parties/create" className="btn btn-primary">
          <Plus size={20} />
          <span>Add Party</span>
        </Link>
      </header>

      <div className="glass-card table-container">
        {parties.length === 0 ? (
          <div className="empty-state">
            <p>No parties found. Click "Add Party" to create one.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Party Name</th>
                <th>City & State</th>
                <th>GSTIN</th>
                <th>PAN</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parties.map((party: any) => (
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
                      <Link href={`/parties/edit/${party.id}`} className="action-btn edit">
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
