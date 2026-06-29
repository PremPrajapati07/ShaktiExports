'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createParty, updateParty } from '@/lib/actions/parties'

export function PartyForm({ party, type = 'Party' }: { party?: any, type?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: party?.name || '',
    address: party?.address || '',
    city: party?.city || '',
    state: party?.state || '',
    stateCode: party?.stateCode || '',
    gstin: party?.gstin || '',
    pan: party?.pan || '',
    type: party?.type || (type === 'Consignee' ? 'ShippedTo' : 'BilledTo')
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target
    const val = ['gstin', 'pan'].includes(name) ? value.toUpperCase() : value
    if (name === 'gstin' && val.length >= 15) {
      setFormData(prev => ({ ...prev, gstin: val, pan: val.substring(2, 12) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: val }))
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (party?.id) {
        await updateParty(party.id, formData)
      } else {
        await createParty(formData)
      }
      router.push(type === 'Consignee' ? '/consignees' : '/parties')
      router.refresh()
    } catch (error) {
      alert('Failed to save party')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-grid">
        <div className="form-group full">
          <label className="form-label">Party Name</label>
          <input 
            type="text" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            className="form-input" 
            required 
            placeholder="e.g. Acme Diamond Corp"
          />
        </div>
        
        <div className="form-group full">
          <label className="form-label">Address</label>
          <textarea 
            name="address" 
            value={formData.address} 
            onChange={handleChange} 
            className="form-input" 
            rows={3} 
            required 
            placeholder="Full address details..."
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">City</label>
          <input 
            type="text" 
            name="city" 
            value={formData.city} 
            onChange={handleChange} 
            className="form-input" 
            required 
            placeholder="Surat"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">State</label>
          <input 
            type="text" 
            name="state" 
            value={formData.state} 
            onChange={handleChange} 
            className="form-input" 
            required 
            placeholder="Gujarat"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">State Code</label>
          <input 
            type="text" 
            name="stateCode" 
            value={formData.stateCode} 
            onChange={handleChange} 
            className="form-input" 
            required 
            placeholder="24"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">GSTIN</label>
          <input 
            type="text" 
            name="gstin" 
            value={formData.gstin} 
            onChange={handleChange} 
            className="form-input" 
            required 
            placeholder="24AAAAA0000A1Z5"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">PAN</label>
          <input 
            type="text" 
            name="pan" 
            value={formData.pan} 
            onChange={handleChange} 
            className="form-input" 
            required 
            placeholder="ABCDE1234F"
          />
        </div>
      </div>
      
      <div className="form-actions">
        <button 
          type="button" 
          onClick={() => router.back()} 
          className="btn btn-outline"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
        >
          {loading ? 'Saving...' : (party?.id ? 'Update Party' : 'Create Party')}
        </button>
      </div>

      <style jsx>{`
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        
        .form-group.full {
          grid-column: span 2;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        
        textarea.form-input {
          resize: vertical;
        }
      `}</style>
    </form>
  )
}
