'use client'

import { Trash2 } from 'lucide-react'
import { deleteSupplier, deletePurchaseBuyer } from '@/lib/actions/purchase-parties'
import { useState } from 'react'

export function DeletePurchasePartyButton({ id, role }: { id: number; role: 'supplier' | 'buyer' }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete this ${role}? This will also delete related invoices.`)) return
    setDeleting(true)
    if (role === 'supplier') await deleteSupplier(id)
    else await deletePurchaseBuyer(id)
    setDeleting(false)
  }

  return (
    <button onClick={handleDelete} className="icon-btn danger" disabled={deleting}>
      <Trash2 size={16} />
    </button>
  )
}
