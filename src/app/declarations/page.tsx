import { getDeclarations } from '@/lib/actions/declarations'
export const dynamic = 'force-dynamic'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DeleteDeclarationButton } from '@/components/DeleteButtons'

export default async function DeclarationsPage() {
  const declarations = await getDeclarations()

  return (
    <div className="declarations-page animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Terms & Declarations</h1>
          <p className="subtitle">Manage templates for invoice terms and conditions</p>
        </div>
        <Link href="/declarations/create" className="btn btn-primary">
          <Plus size={20} />
          <span>Add Template</span>
        </Link>
      </header>

      <div className="glass-card table-container">
        {declarations.length === 0 ? (
          <div className="empty-state">
            <p>No declaration templates found.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Title</th>
                <th>Content Preview</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {declarations.map((dec: { id: number; title: string; body: string }) => (
                <tr key={dec.id}>
                  <td className="font-bold">{dec.title}</td>
                  <td className="preview-text">
                    {dec.body.length > 100 ? dec.body.substring(0, 100) + '...' : dec.body}
                  </td>
                  <td>
                    <div className="actions">
                      <Link href={`/declarations/edit/${dec.id}`} className="action-btn edit">
                        <Edit2 size={16} />
                      </Link>
                      <DeleteDeclarationButton id={dec.id} />
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
