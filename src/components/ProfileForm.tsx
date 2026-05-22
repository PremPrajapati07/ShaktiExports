'use client'

import { useState } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'

export function ProfileForm({ initialProfile }: { initialProfile: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: initialProfile?.companyName || 'SHAKTI EXPORTS',
    gstin: initialProfile?.gstin || '24AAAAA0000A1Z5',
    pan: initialProfile?.pan || 'ABCDE1234F',
    terms: initialProfile?.terms || 'CREDIT',
    banker: initialProfile?.banker || 'STATE BANK OF INDIA',
    accountNo: initialProfile?.accountNo || '12345678901',
    ifsc: initialProfile?.ifsc || 'SBIN0000001',
    swiftCode: initialProfile?.swiftCode || '',
    districtOriginCode: initialProfile?.districtOriginCode || '24',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateProfile(formData)
      alert('Profile updated successfully!')
      router.refresh()
    } catch {
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', maxWidth: '800px' }}>
      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="form-input"
            required
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
          />
        </div>

        <div className="form-group">
          <label className="form-label">Terms of Payment</label>
          <input
            type="text"
            name="terms"
            value={formData.terms}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">District Origin Code</label>
          <input
            type="text"
            name="districtOriginCode"
            value={formData.districtOriginCode}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '1rem 0 0.5rem 0', color: 'var(--foreground)' }}>Bank Details</h3>
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Bank Name</label>
          <input
            type="text"
            name="banker"
            value={formData.banker}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Account No</label>
          <input
            type="text"
            name="accountNo"
            value={formData.accountNo}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">IFSC Code</label>
          <input
            type="text"
            name="ifsc"
            value={formData.ifsc}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">SWIFT Code (Optional)</label>
          <input
            type="text"
            name="swiftCode"
            value={formData.swiftCode}
            onChange={handleChange}
            className="form-input"
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          <Save size={18} />
          <span>{loading ? 'Saving...' : 'Save Profile'}</span>
        </button>
      </div>
    </form>
  )
}
