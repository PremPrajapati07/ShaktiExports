'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { 
  Search, 
  UserCheck, 
  Calendar, 
  Activity, 
  AlertTriangle,
  LogIn,
  Filter
} from 'lucide-react'

interface AuditLog {
  id: number
  username: string
  role: string
  action: string
  entityType: string
  entityId: string | null
  details: string | null
  createdAt: Date
}

interface AuditLogsClientProps {
  logs: AuditLog[]
}

export function AuditLogsClient({ logs }: AuditLogsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [entityFilter, setEntityFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Metrics
  const totalLogs = logs.length
  const totalDeletes = logs.filter(l => l.action === 'DELETE').length
  const totalLogins = logs.filter(l => l.action === 'LOGIN').length

  // Filter logic
  const filteredLogs = logs.filter(log => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      log.username.toLowerCase().includes(searchLower) ||
      (log.details || '').toLowerCase().includes(searchLower) ||
      (log.entityId || '').toLowerCase().includes(searchLower)

    const matchesRole = roleFilter === 'ALL' || log.role === roleFilter
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter
    const matchesEntity = entityFilter === 'ALL' || log.entityType === entityFilter

    let matchesDate = true
    const logTime = new Date(log.createdAt).getTime()
    
    if (dateFrom) {
      const fromTime = new Date(dateFrom).setHours(0, 0, 0, 0)
      if (logTime < fromTime) matchesDate = false
    }
    if (dateTo) {
      const toTime = new Date(dateTo).setHours(23, 59, 59, 999)
      if (logTime > toTime) matchesDate = false
    }

    return matchesSearch && matchesRole && matchesAction && matchesEntity && matchesDate
  })

  return (
    <div className="audit-logs-container">
      {/* Metrics Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card glass-card">
          <div className="icon-container blue">
            <Activity size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Actions Recorded</span>
            <span className="stat-value">{totalLogs}</span>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="icon-container red">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Deletions Prevented/Performed</span>
            <span className="stat-value text-error">{totalDeletes}</span>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="icon-container green">
            <LogIn size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">User Session Logins</span>
            <span className="stat-value text-success">{totalLogins}</span>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div className="filter-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Filter size={18} className="text-primary" />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Filter & Search Logs</h3>
        </div>
        
        <div className="filters-grid">
          <div className="form-group">
            <label className="form-label">Search Details</label>
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search username, details, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input search-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">User Role</label>
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-input select-input"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="ACCOUNTANT">ACCOUNTANT</option>
              <option value="OPERATOR">OPERATOR</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Action</label>
            <select 
              value={actionFilter} 
              onChange={(e) => setActionFilter(e.target.value)}
              className="form-input select-input"
            >
              <option value="ALL">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="EDIT">EDIT</option>
              <option value="DELETE">DELETE</option>
              <option value="PRINT">PRINT</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Entity Type</label>
            <select 
              value={entityFilter} 
              onChange={(e) => setEntityFilter(e.target.value)}
              className="form-input select-input"
            >
              <option value="ALL">All Entities</option>
              <option value="INVOICE">INVOICE</option>
              <option value="PURCHASE_INVOICE">PURCHASE_INVOICE</option>
              <option value="PARTY">PARTY</option>
              <option value="SUPPLIER">SUPPLIER</option>
              <option value="RECONCILIATION">RECONCILIATION</option>
              <option value="PROFILE">PROFILE</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">From Date</label>
            <input 
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">To Date</label>
            <input 
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Log Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss')}
                  </td>
                  <td className="font-bold">
                    {log.username}
                  </td>
                  <td>
                    <span className={`role-badge ${log.role.toLowerCase()}`}>
                      {log.role}
                    </span>
                  </td>
                  <td>
                    <span className={`action-badge ${log.action.toLowerCase()}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className="entity-tag">{log.entityType}</span>
                  </td>
                  <td>
                    {log.entityId ? `#${log.entityId}` : '-'}
                  </td>
                  <td>
                    {log.details}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-row">
                    No matching activity logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-container {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-container.blue {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent);
        }

        .icon-container.red {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }

        .icon-container.green {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success);
        }

        .stat-info {
          display: flex;
          flex-direction: column;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .text-success {
          color: var(--success);
        }

        .text-error {
          color: var(--error);
        }

        .font-bold {
          font-weight: 600;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        @media (min-width: 640px) {
          .filters-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .filters-grid {
            grid-template-columns: repeat(6, 1fr);
          }
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input-wrapper .search-icon {
          position: absolute;
          left: 10px;
          color: var(--text-muted);
          pointer-events: none;
        }

        .search-input-wrapper .search-input {
          padding-left: 2.25rem;
        }

        .select-input {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 16px;
          padding-right: 2rem;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .data-table th, .data-table td {
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .data-table th {
          color: var(--text-muted);
          font-weight: 500;
        }

        .role-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .role-badge.admin {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }

        .role-badge.accountant {
          background: rgba(168, 85, 247, 0.1);
          color: #a855f7;
        }

        .role-badge.operator {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent);
        }

        .action-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .action-badge.create {
          background: rgba(34, 197, 94, 0.1);
          color: var(--success);
        }

        .action-badge.edit {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }

        .action-badge.delete {
          background: rgba(239, 68, 68, 0.1);
          color: var(--error);
        }

        .action-badge.print {
          background: rgba(59, 130, 246, 0.1);
          color: var(--accent);
        }

        .action-badge.login {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        .entity-tag {
          font-family: monospace;
          font-size: 0.8rem;
          background: var(--sidebar-hover);
          padding: 0.125rem 0.25rem;
          border-radius: 4px;
        }

        .empty-row {
          text-align: center;
          padding: 2.5rem !important;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  )
}
