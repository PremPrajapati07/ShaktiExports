'use client'

import { useState } from 'react'
import { loginAction } from '@/lib/actions/auth'
import { Lock, User, Key, KeyRound } from 'lucide-react'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)

    try {
      const res = await loginAction(null, formData)
      if (res.success) {
        // Force complete page reload to update auth cookie state
        window.location.href = '/'
      } else {
        setError(res.error || 'Login failed')
        setLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
  }

  return (
    <div style={{ maxWidth: '400px', width: '100%' }}>
      <form onSubmit={handleSubmit} className="glass-card animate-fade-in" style={{
        padding: '2.5rem 2rem',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent) 0%, #1e40af 100%)',
            color: 'white',
            marginBottom: '1rem',
            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.2)'
          }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Shakti Exports
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Invoicing & Ledger System
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">Username</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }}>
              <User size={18} />
            </span>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }}>
              <Key size={18} />
            </span>
            <input
              type="password"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>

        {/* Demo Credentials Box */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)'
        }}>
          <p style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <KeyRound size={14} /> Quick Demo Accounts:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => fillCredentials('admin', 'admin123')}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main)',
                padding: '0.4rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('accountant', 'accountant123')}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main)',
                padding: '0.4rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Accountant
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('operator', 'operator123')}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: 'var(--text-main)',
                padding: '0.4rem',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              Operator
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
