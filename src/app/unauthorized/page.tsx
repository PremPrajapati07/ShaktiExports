import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="glass-card animate-fade-in" style={{
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
        padding: '3rem 2rem',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(239, 68, 68, 0.05)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          marginBottom: '1.5rem'
        }}>
          <ShieldAlert size={36} />
        </div>
        
        <h1 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          color: '#ef4444',
          marginBottom: '0.75rem'
        }}>
          Access Denied
        </h1>
        
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
          lineHeight: 1.5,
          marginBottom: '2rem'
        }}>
          You do not have the required permissions to access this page. Please contact your administrator if you believe this is an error.
        </p>

        <Link href="/" className="btn btn-primary" style={{ display: 'inline-block' }}>
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
