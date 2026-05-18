export const dynamic = 'force-dynamic'

import {
  FileText,
  Users,
  TrendingUp,
  IndianRupee,
  Plus,
  ArrowRight,
  ShoppingCart
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format, startOfMonth } from 'date-fns'

async function getStats() {
  const [
    totalSellInvoices,
    sellValueRaw,
    sellInvoicesThisMonth,
    totalParties,
    totalPurchaseInvoices,
    purchaseValueRaw,
    purchaseThisMonth,
  ] = await Promise.all([
    prisma.invoice.count(),
    prisma.invoice.aggregate({ _sum: { totalValue: true } }),
    prisma.invoice.count({ where: { date: { gte: startOfMonth(new Date()) } } }),
    prisma.party.count(),
    prisma.purchaseInvoice.count(),
    prisma.purchaseInvoice.aggregate({ _sum: { totalValue: true } }),
    prisma.purchaseInvoice.count({ where: { date: { gte: startOfMonth(new Date()) } } }),
  ])

  const sellValue = sellValueRaw._sum.totalValue || 0
  const purchaseValue = purchaseValueRaw._sum.totalValue || 0

  return {
    totalSellInvoices,
    totalPurchaseInvoices,
    sellValue,
    purchaseValue,
    totalValue: sellValue + purchaseValue,
    invoicesThisMonth: sellInvoicesThisMonth + purchaseThisMonth,
    totalParties,
  }
}

async function getRecentInvoices() {
  const [sellInvoices, purchaseInvoices] = await Promise.all([
    prisma.invoice.findMany({ take: 4, orderBy: { createdAt: 'desc' }, include: { billedTo: true } }),
    prisma.purchaseInvoice.findMany({ take: 4, orderBy: { createdAt: 'desc' }, include: { supplier: true } }),
  ])
  return { sellInvoices, purchaseInvoices }
}

export default async function Dashboard() {
  const stats = await getStats()
  const { sellInvoices, purchaseInvoices } = await getRecentInvoices()

  const cards = [
    { name: 'Total Sell Invoices', value: stats.totalSellInvoices, icon: FileText, color: 'blue' },
    { name: 'Total Purchase Invoices', value: stats.totalPurchaseInvoices, icon: ShoppingCart, color: 'purple' },
    { name: 'Combined Value', value: `₹${stats.totalValue.toLocaleString()}`, icon: IndianRupee, color: 'green' },
    { name: 'Invoices This Month', value: stats.invoicesThisMonth, icon: TrendingUp, color: 'orange' },
  ]

  return (
    <div className="dashboard animate-fade-in">
      <header className="page-header">
        <div className="header-content">
          <h1>Dashboard</h1>
          <p className="subtitle">Welcome to Shakti Exports Invoice Manager</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/invoices/create" className="btn btn-primary">
            <Plus size={20} /> Sell Invoice
          </Link>
          <Link href="/purchase-invoices/create" className="btn btn-outline">
            <ShoppingCart size={20} /> Purchase Invoice
          </Link>
        </div>
      </header>

      <div className="stats-grid">
        {cards.map((card) => (
          <div key={card.name} className="stat-card glass-card">
            <div className={`icon-container ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-label">{card.name}</span>
              <span className="stat-value">{card.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Second row: sell vs purchase value */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="icon-container blue"><IndianRupee size={20} /></div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sell Invoice Total</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{stats.sellValue.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="icon-container purple"><ShoppingCart size={20} /></div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Purchase Invoice Total</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{stats.purchaseValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Sell Invoices */}
        <div className="glass-card">
          <div className="card-header">
            <h3>Recent Sell Invoices</h3>
            <Link href="/invoices" className="text-link">View All <ArrowRight size={16} /></Link>
          </div>
          {sellInvoices.length === 0 ? (
            <div className="empty-state"><p>No sell invoices yet.</p></div>
          ) : (
            <div className="recent-list">
              {sellInvoices.map((inv: any) => (
                <div key={inv.id} className="recent-item">
                  <div className="item-info">
                    <span className="item-no">{inv.invoiceNo}</span>
                    <span className="item-party">{inv.billedTo.name}</span>
                  </div>
                  <div className="item-meta">
                    <span className="item-date">{format(new Date(inv.date), 'dd MMM')}</span>
                    <span className="item-value">₹{inv.totalValue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Purchase Invoices */}
        <div className="glass-card">
          <div className="card-header">
            <h3>Recent Purchases</h3>
            <Link href="/purchase-invoices" className="text-link">View All <ArrowRight size={16} /></Link>
          </div>
          {purchaseInvoices.length === 0 ? (
            <div className="empty-state"><p>No purchase invoices yet.</p></div>
          ) : (
            <div className="recent-list">
              {purchaseInvoices.map((inv: any) => (
                <div key={inv.id} className="recent-item">
                  <div className="item-info">
                    <span className="item-no">{inv.invoiceNo}</span>
                    <span className="item-party">{inv.supplier.name}</span>
                  </div>
                  <div className="item-meta">
                    <span className="item-date">{format(new Date(inv.date), 'dd MMM')}</span>
                    <span className="item-value">₹{inv.totalValue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
