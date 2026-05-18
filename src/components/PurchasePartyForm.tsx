'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  action: (data: any) => Promise<void>
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
      await action(data)
      router.push(redirectTo)
    } catch {
      alert('Failed to save')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card">
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
                onChange={e => setData({ ...data, [f.key]: e.target.value })}
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

