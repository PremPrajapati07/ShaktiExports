export const dynamic = 'force-dynamic'

import { getAuthSession } from '@/lib/auth'
import { getAuditLogs } from '@/lib/actions/logs'
import { AuditLogsClient } from '@/components/AuditLogsClient'
import { redirect } from 'next/navigation'

export default async function AuditLogsPage() {
  const session = await getAuthSession()
  if (!session || session.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  const logs = await getAuditLogs()

  return (
    <div className="animate-fade-in">
      <header className="page-header" style={{ marginBottom: '2rem' }}>
        <h1>System Audit Logs</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-muted)' }}>
          Track and inspect all system activity, logins, and billing modifications
        </p>
      </header>
      <AuditLogsClient logs={logs as any} />
    </div>
  )
}
