'use client'

import { Trash2 } from 'lucide-react'
import { deleteParty } from '@/lib/actions/parties'
import { deleteInvoice } from '@/lib/actions/invoices'
import { useState } from 'react'

export function DeletePartyButton({ id }: { id: number }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this party? All related invoices will also be deleted.')) {
      setIsDeleting(true)
      try {
        await deleteParty(id)
      } catch (error) {
        alert('Failed to delete party')
        setIsDeleting(false)
      }
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      className="action-btn delete"
      disabled={isDeleting}
      title="Delete Party"
    >
      <Trash2 size={16} />
    </button>
  )
}

export function DeleteInvoiceButton({ id }: { id: number }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      setIsDeleting(true)
      try {
        await deleteInvoice(id)
      } catch (error) {
        alert('Failed to delete invoice')
        setIsDeleting(false)
      }
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      className="action-btn delete"
      disabled={isDeleting}
      title="Delete Invoice"
    >
      <Trash2 size={16} />
    </button>
  )
}

export function DeleteDeclarationButton({ id }: { id: number }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this declaration template?')) {
      setIsDeleting(true)
      try {
        const { deleteDeclaration } = await import('@/lib/actions/declarations')
        await deleteDeclaration(id)
      } catch (error) {
        alert('Failed to delete declaration')
        setIsDeleting(false)
      }
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      className="action-btn delete"
      disabled={isDeleting}
      title="Delete Declaration"
    >
      <Trash2 size={16} />
    </button>
  )
}

export function DeletePurchasePartyButton({ id, role }: { id: number; role: 'supplier' | 'buyer' }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (confirm(`Delete this ${role}? Related invoices will also be deleted.`)) {
      setIsDeleting(true)
      try {
        if (role === 'supplier') {
          const { deleteSupplier } = await import('@/lib/actions/purchase-parties')
          await deleteSupplier(id)
        } else {
          const { deletePurchaseBuyer } = await import('@/lib/actions/purchase-parties')
          await deletePurchaseBuyer(id)
        }
      } catch {
        alert('Failed to delete')
        setIsDeleting(false)
      }
    }
  }

  return (
    <button onClick={handleDelete} className="icon-btn danger" disabled={isDeleting} title={`Delete ${role}`}>
      <Trash2 size={16} />
    </button>
  )
}
