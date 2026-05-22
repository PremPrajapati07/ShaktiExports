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
  Package,
  Settings,
  Menu,
  X
} from 'lucide-react'
import { clsx } from 'clsx'
import { useState, useEffect } from 'react'

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
  const [isOpen, setIsOpen] = useState(false)

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    if (href === '/invoices') {
      return pathname === '/invoices' || pathname.startsWith('/invoices/view') || pathname.startsWith('/invoices/edit')
    }
    if (href === '/purchase-invoices') {
      return pathname === '/purchase-invoices' || pathname.startsWith('/purchase-invoices/view') || pathname.startsWith('/purchase-invoices/edit')
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="mobile-header">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsOpen(true)}
          aria-label="Open Menu"
        >
          <Menu size={24} />
        </button>
        <div className="mobile-logo">
          <Diamond className="logo-icon" size={24} />
          <span className="mobile-brand-name">Shakti Exports</span>
        </div>
      </header>

      {isOpen && (
        <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}

      <aside className={clsx("sidebar", isOpen && "sidebar-open")}>
        <div className="sidebar-header">
          <div className="logo">
            <Diamond className="logo-icon" size={32} />
            <div className="logo-text">
              <span className="brand-name">Shakti Exports</span>
              <span className="brand-tagline">Diamond Traders</span>
            </div>
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setIsOpen(false)}
            aria-label="Close Menu"
          >
            <X size={20} />
          </button>
        </div>

      <nav className="sidebar-nav">
        <Link href="/" className={clsx('nav-link', pathname === '/' && 'active')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link href="/stock" className={clsx('nav-link', pathname.startsWith('/stock') && 'active')}>
          <Package size={20} />
          <span>Stock & Inventory</span>
        </Link>
        <Link href="/profile" className={clsx('nav-link', pathname.startsWith('/profile') && 'active')}>
          <Settings size={20} />
          <span>Company Profile</span>
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
    </>
  )
}
