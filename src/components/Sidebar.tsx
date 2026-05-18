'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Truck,
  FileText,
  PlusCircle,
  List,
  Diamond,
  ShoppingCart,
  Store,
  Package
} from 'lucide-react'
import { clsx } from 'clsx'

const sellItems = [
  { name: 'Manage Parties', href: '/parties', icon: Users },
  { name: 'Manage Consignees', href: '/consignees', icon: Truck },
  { name: 'Declarations', href: '/declarations', icon: FileText },
  { name: 'Create Invoice', href: '/invoices/create', icon: PlusCircle },
  { name: 'Invoice List', href: '/invoices', icon: List },
]

const purchaseItems = [
  { name: 'Manage Suppliers', href: '/purchase-suppliers', icon: Store },
  { name: 'Manage Buyers', href: '/purchase-buyers', icon: Package },
  { name: 'Create Purchase Invoice', href: '/purchase-invoices/create', icon: ShoppingCart },
  { name: 'Purchase Invoice List', href: '/purchase-invoices', icon: List },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <Diamond className="logo-icon" size={32} />
          <div className="logo-text">
            <span className="brand-name">Shakti Exports</span>
            <span className="brand-tagline">Diamond Traders</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <Link href="/" className={clsx('nav-link', pathname === '/' && 'active')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>

        <div className="nav-section-title">Sell Invoices</div>
        {sellItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={clsx('nav-link', isActive(item.href) && 'active')}
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </Link>
        ))}

        <div className="nav-section-title">Purchase Invoices</div>
        {purchaseItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={clsx('nav-link', isActive(item.href) && 'active')}
          >
            <item.icon size={20} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
