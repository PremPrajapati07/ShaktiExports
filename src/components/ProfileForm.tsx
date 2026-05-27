'use client'

import { useState } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import { useRouter } from 'next/navigation'
import { Save, AlertTriangle, Image as ImageIcon } from 'lucide-react'

export function ProfileForm({ initialProfile, user }: { initialProfile: any; user: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isReadOnly = user?.role !== 'ADMIN'

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
    signatureImage: initialProfile?.signatureImage || null,
    sealImage: initialProfile?.sealImage || null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'signatureImage' | 'sealImage') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024) {
      alert('Image size must be less than 500KB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [fieldName]: reader.result as string
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = (fieldName: 'signatureImage' | 'sealImage') => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: null
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly) return
    setLoading(true)
    try {
      await updateProfile(formData)
      alert('Profile updated successfully!')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card" style={{ padding: '2rem', maxWidth: '800px' }}>
      {isReadOnly && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem',
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          border: '1px solid rgba(249, 115, 22, 0.2)',
          borderRadius: 'var(--radius)',
          color: '#f97316',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          <AlertTriangle size={18} />
          <span>View-Only Mode: Only administrators can update the company profile and billing defaults.</span>
        </div>
      )}

      <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Company Name</label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleChange}
            className="form-input"
            disabled={isReadOnly}
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
            disabled={isReadOnly}
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
            disabled={isReadOnly}
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
            disabled={isReadOnly}
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
            disabled={isReadOnly}
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
            disabled={isReadOnly}
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
            disabled={isReadOnly}
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
            disabled={isReadOnly}
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
            disabled={isReadOnly}
          />
        </div>

        {/* ── Signature & Seal Stamp Image Uploads ── */}
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '1rem 0 0.5rem 0', color: 'var(--foreground)' }}>Digital Signatures & Seals</h3>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Upload company seal and signature to automatically embed them in invoice PDFs. Max 500KB per image.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Authorized Signature Image</label>
          {!isReadOnly && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'signatureImage')}
              className="form-input"
              style={{ padding: '0.4rem' }}
            />
          )}
          {formData.signatureImage ? (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--sidebar-hover)'
            }}>
              <img
                src={formData.signatureImage}
                alt="Signature Preview"
                style={{ maxHeight: '60px', objectFit: 'contain', background: '#fff' }}
              />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage('signatureImage')}
                  className="btn btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--error)' }}
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <div style={{
              marginTop: '0.75rem',
              padding: '1rem',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              <ImageIcon size={24} style={{ marginBottom: '0.25rem' }} />
              <span>No signature image uploaded</span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Company Seal / Stamp Image</label>
          {!isReadOnly && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'sealImage')}
              className="form-input"
              style={{ padding: '0.4rem' }}
            />
          )}
          {formData.sealImage ? (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--sidebar-hover)'
            }}>
              <img
                src={formData.sealImage}
                alt="Seal Preview"
                style={{ maxHeight: '60px', objectFit: 'contain', background: '#fff' }}
              />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage('sealImage')}
                  className="btn btn-outline"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--error)' }}
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            <div style={{
              marginTop: '0.75rem',
              padding: '1rem',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.85rem'
            }}>
              <ImageIcon size={24} style={{ marginBottom: '0.25rem' }} />
              <span>No seal image uploaded</span>
            </div>
          )}
        </div>
      </div>

      {!isReadOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={18} />
            <span>{loading ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      )}
    </form>
  )
}

