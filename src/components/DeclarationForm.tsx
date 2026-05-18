'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDeclaration, updateDeclaration } from '@/lib/actions/declarations'

export function DeclarationForm({ declaration }: { declaration?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: declaration?.title || '',
    body: declaration?.body || ''
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (declaration?.id) {
        await updateDeclaration(declaration.id, formData)
      } else {
        await createDeclaration(formData)
      }
      router.push('/declarations')
      router.refresh()
    } catch (error) {
      alert('Failed to save declaration')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <div className="form-group">
        <label className="form-label">Template Title</label>
        <input 
          type="text" 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          className="form-input" 
          required 
          placeholder="e.g. Standard Natural Diamond Declaration"
        />
      </div>
      
      <div className="form-group">
        <label className="form-label">Declaration Body</label>
        <textarea 
          name="body" 
          value={formData.body} 
          onChange={handleChange} 
          className="form-input" 
          rows={10} 
          required 
          placeholder="Multiline declaration text..."
        />
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
          {loading ? 'Saving...' : (declaration?.id ? 'Update Template' : 'Create Template')}
        </button>
      </div>

      <style jsx>{`
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        textarea.form-input { resize: vertical; }
      `}</style>
    </form>
  )
}
