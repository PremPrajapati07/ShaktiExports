'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupplier, updateSupplier, createPurchaseBuyer, updatePurchaseBuyer } from '@/lib/actions/purchase-parties'

const baseFields = [
  { key: 'name', label: 'Name', required: true },
  { key: 'address', label: 'Address (multiline)', multiline: true, required: true },
  { key: 'city', label: 'City', required: true },
  { key: 'state', label: 'State', required: true },
  { key: 'stateCode', label: 'State Code', required: true },
  { key: 'gstin', label: 'GSTIN', required: true },
  { key: 'pan', label: 'PAN', required: true },
]

const bankFields = [
  { key: 'bankerName', label: 'Bank Name' },
  { key: 'accountNo', label: 'Account No' },
  { key: 'ifsc', label: 'IFSC Code' },
  { key: 'swiftCode', label: 'SWIFT Code' },
]

export function PurchasePartyForm({
  initialData,
  action,
  redirectTo,
  label,
  role
}: {
  initialData?: any
  action?: any
  redirectTo: string
  label: string
  role?: 'supplier' | 'buyer'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    name: initialData?.name || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || 'Gujarat',
    stateCode: initialData?.stateCode || '24',
    gstin: initialData?.gstin || '',
    pan: initialData?.pan || '',
    bankerName: initialData?.bankerName || '',
    accountNo: initialData?.accountNo || '',
    ifsc: initialData?.ifsc || '',
    swiftCode: initialData?.swiftCode || '',
    type: initialData?.type || 'Both',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (role === 'supplier') {
        if (initialData?.id) {
          await updateSupplier(initialData.id, data)
        } else {
          await createSupplier(data)
        }
      } else {
        if (initialData?.id) {
          await updatePurchaseBuyer(initialData.id, data)
        } else {
          await createPurchaseBuyer(data)
        }
      }
      router.push(redirectTo)
    } catch {
      alert('Failed to save')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card">
      {initialData?.isCompany && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          color: '#3b82f6',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          lineHeight: '1.4',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-start'
        }}>
          <span>💡</span>
          <div>
            <strong>Company Default Profile</strong>: Name, GSTIN, and PAN are managed under your{' '}
            <a href="/profile" style={{ textDecoration: 'underline', fontWeight: 600, color: '#3b82f6' }}>
              Company Profile
            </a>.
            You can customize the address and buyer type below.
          </div>
        </div>
      )}

      <div className="form-grid">
        {baseFields.map(f => (
          <div key={f.key} className="form-group">
            <label className="form-label">{f.label}</label>
            {f.multiline ? (
              <textarea
                className="form-input"
                rows={3}
                value={(data as any)[f.key]}
                required={f.required}
                onChange={e => setData({ ...data, [f.key]: e.target.value })}
              />
            ) : (
              <input
                type="text"
                className="form-input"
                value={(data as any)[f.key]}
                required={f.required}
                disabled={initialData?.isCompany && ['name', 'gstin', 'pan'].includes(f.key)}
                onChange={e => {
                  const val = ['gstin', 'pan'].includes(f.key) ? e.target.value.toUpperCase() : e.target.value
                  if (f.key === 'gstin' && val.length >= 15) {
                    setData({ ...data, gstin: val, pan: val.substring(2, 12) })
                  } else {
                    setData({ ...data, [f.key]: val })
                  }
                }}
              />
            )}
          </div>
        ))}

        {role === 'supplier' && bankFields.map(f => (
          <div key={f.key} className="form-group">
            <label className="form-label">{f.label}</label>
            <input
              type="text"
              className="form-input"
              value={(data as any)[f.key]}
              onChange={e => setData({ ...data, [f.key]: e.target.value })}
            />
          </div>
        ))}

        {role === 'buyer' && (
          <div className="form-group">
            <label className="form-label">Buyer Type</label>
            <select
              className="form-input"
              value={data.type}
              onChange={e => setData({ ...data, type: e.target.value })}
            >
              <option value="Both">Both (Consignee &amp; Buyer)</option>
              <option value="ShipTo">Consignee Only (Ship To)</option>
              <option value="BillTo">Buyer Only (Bill To)</option>
            </select>
          </div>
        )}
      </div>
      <div className="form-navigation" style={{ marginTop: '1.5rem' }}>
        <button type="button" className="btn btn-outline" onClick={() => router.back()}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : `Save ${label}`}
        </button>
      </div>
    </form>
  )
}

