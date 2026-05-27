'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, User, Key } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Invalid username or password. (Are you sure the database is connected?)')
        setLoading(false)
      } else {
        window.location.href = '/'
      }
    } catch (err) {
      setError('An error occurred during login')
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: '1rem' }}>
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontWeight: 600, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
